<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Classes\Agora\RtcTokenBuilder2;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class VideoController extends Controller
{
    /**
     * Generate Agora token for consultation video call
     */
    public function generateToken(Request $request, $consultationId): JsonResponse
    {
        try {
            // Validate the consultation exists and user has access
            $consultation = $this->validateConsultationAccess($consultationId);

            // Ensure consultation is paid
            if ($consultation->payment_status !== 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment required to join video consultation'
                ], 403);
            }

            // Generate or get existing channel name
            if (!$consultation->agora_channel) {
                $consultation->agora_channel = 'consultation_' . $consultation->id . '_' . time();
                $consultation->save();
            }

            // Credentials come through config() so they survive config:cache.
            $appId = config('agora.app_id');
            $appCertificate = config('agora.app_certificate');

            if (! $appId || ! $appCertificate) {
                Log::error('Agora credentials are not configured');

                return response()->json([
                    'success' => false,
                    'message' => 'Video calling is not configured on this server',
                ], 503);
            }

            // Numeric uid: the account id, the same value the browser joins with.
            $channelName = $consultation->agora_channel;
            $uid = (int) Auth::id();
            $ttl = (int) config('agora.token_ttl', 7200);
            $privilegeExpiredTs = time() + $ttl;

            $token = RtcTokenBuilder2::buildTokenWithUid(
                $appId,
                $appCertificate,
                $channelName,
                $uid,
                RtcTokenBuilder2::ROLE_PUBLISHER,
                $ttl,
                $ttl
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'token' => $token,
                    'channel' => $channelName,
                    'uid' => $uid,
                    'appId' => $appId,
                    'consultation_id' => $consultation->id,
                    'expires_at' => Carbon::createFromTimestamp($privilegeExpiredTs)->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Video token generation failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate video token'
            ], 500);
        }
    }

    /**
     * Start video session (mark consultation as started)
     */
    public function startSession(Request $request, $consultationId): JsonResponse
    {
        try {
            $consultation = $this->validateConsultationAccess($consultationId);

            // Mark session as started if not already started
            if (!$consultation->started_at) {
                $consultation->started_at = now();
                $consultation->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Video session started',
                'data' => [
                    'consultation_id' => $consultation->id,
                    'started_at' => $consultation->started_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Start video session failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to start video session'
            ], 500);
        }
    }

    /**
     * End video session (mark consultation as ended and calculate duration)
     */
    public function endSession(Request $request, $consultationId): JsonResponse
    {
        try {
            $consultation = $this->validateConsultationAccess($consultationId);

            // Mark session as ended
            if (!$consultation->ended_at) {
                $consultation->ended_at = now();

                // Calculate duration if session was started
                if ($consultation->started_at) {
                    $startTime = Carbon::parse($consultation->started_at);
                    $endTime = Carbon::parse($consultation->ended_at);
                    $consultation->duration_minutes = (int) abs($startTime->diffInMinutes($endTime));
                }

                $consultation->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Video session ended',
                'data' => [
                    'consultation_id' => $consultation->id,
                    'started_at' => $consultation->started_at,
                    'ended_at' => $consultation->ended_at,
                    'duration_minutes' => $consultation->duration_minutes
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('End video session failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to end video session'
            ], 500);
        }
    }

    /**
     * Get session status
     */
    public function getSessionStatus($consultationId): JsonResponse
    {
        try {
            $consultation = $this->validateConsultationAccess($consultationId);

            $status = 'pending';
            if ($consultation->started_at && !$consultation->ended_at) {
                $status = 'active';
            } elseif ($consultation->ended_at) {
                $status = 'ended';
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'consultation_id' => $consultation->id,
                    'status' => $status,
                    'agora_channel' => $consultation->agora_channel,
                    'started_at' => $consultation->started_at,
                    'ended_at' => $consultation->ended_at,
                    'duration_minutes' => $consultation->duration_minutes,
                    'payment_status' => $consultation->payment_status
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Get session status failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to get session status'
            ], 500);
        }
    }

    /**
     * Validate consultation access for current user
     */
    private function validateConsultationAccess($consultationId)
    {
        $user = Auth::user();

        $consultation = Consultation::findOrFail($consultationId);

        // Check if user is either the patient or the assigned doctor
        $hasAccess = false;

        if ($user->role === 'patient' && $consultation->patient_id === $user->id) {
            $hasAccess = true;
        } elseif ($user->role === 'doctor' && $consultation->doctor_id === $user->id) {
            $hasAccess = true;
        }

        if (!$hasAccess) {
            throw new \Exception('Unauthorized access to consultation');
        }

        return $consultation;
    }
}
