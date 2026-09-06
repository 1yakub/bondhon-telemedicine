<?php

namespace App\Http\Controllers;

use App\Classes\Agora\RtcTokenBuilder2;
use App\Models\Consultation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Agora room for one paid consultation. The `can:join` middleware on the route
 * group already proved the caller is the patient or the doctor and that the
 * consultation is paid.
 */
class VideoController extends Controller
{
    public function token(Request $request, Consultation $consultation): JsonResponse
    {
        $appId = config('agora.app_id');
        $certificate = config('agora.app_certificate');

        if (! $appId || ! $certificate) {
            return response()->json(['message' => 'Video calling is not configured on this server.'], 503);
        }

        if (! $consultation->agora_channel) {
            $consultation->update(['agora_channel' => 'consultation_'.$consultation->id.'_'.bin2hex(random_bytes(4))]);
        }

        $uid = (int) $request->user()->id;
        $ttl = (int) config('agora.token_ttl', 7200);

        $token = RtcTokenBuilder2::buildTokenWithUid(
            $appId,
            $certificate,
            $consultation->agora_channel,
            $uid,
            RtcTokenBuilder2::ROLE_PUBLISHER,
            $ttl,
            $ttl,
        );

        return response()->json([
            'token' => $token,
            'channel' => $consultation->agora_channel,
            'uid' => $uid,
            'app_id' => $appId,
            'expires_at' => now()->addSeconds($ttl)->toIso8601String(),
        ]);
    }

    public function start(Consultation $consultation): JsonResponse
    {
        if (! $consultation->started_at) {
            $consultation->update(['started_at' => now()]);
        }

        return $this->status($consultation);
    }

    public function end(Consultation $consultation): JsonResponse
    {
        if (! $consultation->ended_at) {
            $endedAt = now();
            $consultation->update([
                'ended_at' => $endedAt,
                'duration_minutes' => $consultation->started_at
                    ? (int) $consultation->started_at->diffInMinutes($endedAt, true)
                    : 0,
            ]);
        }

        return $this->status($consultation);
    }

    public function status(Consultation $consultation): JsonResponse
    {
        return response()->json([
            'consultation_id' => $consultation->id,
            'status' => $consultation->status,
            'agora_channel' => $consultation->agora_channel,
            'started_at' => $consultation->started_at,
            'ended_at' => $consultation->ended_at,
            'duration_minutes' => $consultation->duration_minutes,
            'payment_status' => $consultation->payment_status,
        ]);
    }
}
