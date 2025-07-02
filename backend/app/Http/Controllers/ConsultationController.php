<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\Consultation;
use App\Models\User;
use App\Models\Doctor;

class ConsultationController extends Controller
{
    // Middleware is applied at route level in api.php

    /**
     * Get patient's consultations
     * GET /api/consultations
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json([
                'message' => 'Only patients can view consultations'
            ], 403);
        }

        try {
            $consultations = Consultation::where('patient_id', $user->id)
                ->with(['doctor.doctor'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($consultation) {
                    return [
                        'id' => $consultation->id,
                        'patient_id' => $consultation->patient_id,
                        'doctor_id' => $consultation->doctor_id,
                        'doctor' => $consultation->doctor ? [
                            'id' => $consultation->doctor->id,
                            'name' => $consultation->doctor->name,
                            'specialization' => $consultation->doctor->doctor->specialization ?? 'General Practice',
                            'gender' => $consultation->doctor->gender,
                            'profile_photo' => $consultation->doctor->profile_photo,
                        ] : null,
                        'scheduled_at' => $consultation->started_at ?? $consultation->created_at,
                        'status' => $this->mapStatus($consultation->payment_status, $consultation->started_at, $consultation->ended_at),
                        'amount' => $consultation->fee_amount,
                        'duration' => $consultation->duration_minutes ?: 30,
                        'notes' => $consultation->patient_symptoms,
                        'payment_status' => $consultation->payment_status,
                        'agora_channel' => $consultation->agora_channel,
                        'created_at' => $consultation->created_at,
                        'updated_at' => $consultation->updated_at,
                    ];
                });

            return response()->json([
                'consultations' => $consultations
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch consultations', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to fetch consultations',
                'error' => env('APP_ENV') === 'local' ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Book a new consultation
     * POST /api/consultations
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json([
                'message' => 'Only patients can book consultations'
            ], 403);
        }

        $request->validate([
            'doctor_id' => 'required|exists:users,id',
            'patient_symptoms' => 'nullable|string|max:1000',
            'scheduled_time' => 'nullable|date|after:now',
        ]);

        try {
            // Verify doctor exists and is actually a doctor
            $doctor = User::where('id', $request->doctor_id)
                ->where('role', 'doctor')
                ->with('doctor')
                ->first();

            if (!$doctor) {
                return response()->json([
                    'message' => 'Doctor not found'
                ], 404);
            }

            // Check if doctor is available
            if (!$doctor->doctor || !$doctor->doctor->is_online) {
                return response()->json([
                    'message' => 'Doctor is currently offline'
                ], 400);
            }

            // Get doctor's consultation fee
            $feeAmount = $doctor->doctor->fee_per_consultation ?? 500;

            // Create consultation
            $consultation = Consultation::create([
                'patient_id' => $user->id,
                'doctor_id' => $doctor->id,
                'patient_symptoms' => $request->patient_symptoms,
                'fee_amount' => $feeAmount,
                'payment_status' => 'pending',
                'started_at' => $request->scheduled_time,
            ]);

            // Load relationships for response
            $consultation->load(['doctor.doctor']);

            return response()->json([
                'message' => 'Consultation booked successfully',
                'consultation' => [
                    'id' => $consultation->id,
                    'doctor' => [
                        'id' => $consultation->doctor->id,
                        'name' => $consultation->doctor->name,
                        'specialization' => $consultation->doctor->doctor->specialization ?? 'General Practice',
                    ],
                    'scheduled_at' => $consultation->started_at,
                    'amount' => $consultation->fee_amount,
                    'status' => 'pending',
                    'payment_required' => true,
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to book consultation', [
                'user_id' => $user->id,
                'doctor_id' => $request->doctor_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to book consultation',
                'error' => env('APP_ENV') === 'local' ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get consultation details by transaction ID (public, for payment success page)
     * GET /api/consultations/public/{transaction_id}
     */
    public function getByTransaction($transactionId)
    {
        try {
            // Find the payment record first
            $payment = \App\Models\Payment::where('ssl_transaction_id', $transactionId)
                ->where('ssl_status', 'VALID')
                ->first();

            if (!$payment) {
                return response()->json([
                    'message' => 'Payment not found or not valid'
                ], 404);
            }

            // Get the consultation with relationships
            $consultation = Consultation::with(['doctor.doctor', 'patient'])
                ->findOrFail($payment->consultation_id);

            return response()->json([
                'consultation' => [
                    'id' => $consultation->id,
                    'doctor' => [
                        'id' => $consultation->doctor->id,
                        'name' => $consultation->doctor->name,
                        'specialization' => $consultation->doctor->doctor->specialization ?? 'General Practice',
                        'gender' => $consultation->doctor->gender,
                    ],
                    'consultation_date' => $consultation->started_at ? $consultation->started_at->format('Y-m-d') : now()->format('Y-m-d'),
                    'consultation_time' => $consultation->started_at ? $consultation->started_at->format('H:i') : '09:00',
                    'amount' => $consultation->fee_amount,
                    'payment_status' => $consultation->payment_status,
                    'status' => $consultation->status,
                    'symptoms' => $consultation->patient_symptoms,
                    'created_at' => $consultation->created_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch consultation by transaction', [
                'transaction_id' => $transactionId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to fetch consultation details'
            ], 500);
        }
    }

    /**
     * Get specific consultation details
     * GET /api/consultations/{id}
     */
    public function show(Request $request, $id)
    {
        $user = Auth::user();

        try {
            $consultation = Consultation::with(['doctor.doctor', 'patient'])
                ->findOrFail($id);

            // Check if user has access to this consultation
            if ($user->role === 'patient' && $consultation->patient_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized access to consultation'
                ], 403);
            }

            if ($user->role === 'doctor' && $consultation->doctor_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized access to consultation'
                ], 403);
            }

            return response()->json([
                'consultation' => [
                    'id' => $consultation->id,
                    'patient' => [
                        'id' => $consultation->patient->id,
                        'name' => $consultation->patient->name,
                        'phone' => $consultation->patient->phone,
                        'age' => $consultation->patient->date_of_birth
                            ? now()->diffInYears($consultation->patient->date_of_birth)
                            : null,
                        'gender' => $consultation->patient->gender,
                    ],
                    'doctor' => [
                        'id' => $consultation->doctor->id,
                        'name' => $consultation->doctor->name,
                        'specialization' => $consultation->doctor->doctor->specialization ?? 'General Practice',
                        'qualifications' => $consultation->doctor->doctor->qualifications,
                    ],
                    'scheduled_at' => $consultation->started_at,
                    'status' => $this->mapStatus($consultation->payment_status, $consultation->started_at, $consultation->ended_at),
                    'amount' => $consultation->fee_amount,
                    'duration' => $consultation->duration_minutes,
                    'patient_symptoms' => $consultation->patient_symptoms,
                    'doctor_notes' => $consultation->doctor_notes,
                    'payment_status' => $consultation->payment_status,
                    'agora_channel' => $consultation->agora_channel,
                    'created_at' => $consultation->created_at,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to fetch consultation details', [
                'user_id' => $user->id,
                'consultation_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Consultation not found',
                'error' => env('APP_ENV') === 'local' ? $e->getMessage() : 'Not found'
            ], 404);
        }
    }

    /**
     * Cancel a consultation
     * DELETE /api/consultations/{id}
     */
    public function destroy(Request $request, $id)
    {
        $user = Auth::user();

        try {
            $consultation = Consultation::findOrFail($id);

            // Check permissions
            if ($user->role === 'patient' && $consultation->patient_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized to cancel this consultation'
                ], 403);
            }

            // Only allow cancellation of pending consultations
            if ($consultation->payment_status !== 'pending') {
                return response()->json([
                    'message' => 'Cannot cancel a consultation that has been paid or failed'
                ], 400);
            }

            $consultation->delete();

            return response()->json([
                'message' => 'Consultation cancelled successfully'
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to cancel consultation', [
                'user_id' => $user->id,
                'consultation_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to cancel consultation',
                'error' => env('APP_ENV') === 'local' ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Map internal status to frontend status
     */
    private function mapStatus($paymentStatus, $startedAt, $endedAt)
    {
        if ($endedAt) {
            return 'completed';
        }

        if ($startedAt && !$endedAt) {
            return 'confirmed';
        }

        switch ($paymentStatus) {
            case 'paid':
                return 'confirmed';
            case 'failed':
                return 'cancelled';
            case 'pending':
            default:
                return 'pending';
        }
    }

    public function mine(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role === 'patient') {
                // Patient viewing their consultations
                $consultations = Consultation::where('patient_id', $user->id)
                    ->with(['doctor.doctor', 'payment'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                $consultations->transform(function ($consultation) {
                    return [
                        'id' => $consultation->id,
                        'doctor_name' => $consultation->doctor->name,
                        'doctor_specialization' => $consultation->doctor->doctor->specialization ?? 'General Practice',
                        'patient_symptoms' => $consultation->patient_symptoms,
                        'doctor_notes' => $consultation->doctor_notes,
                        'status' => $consultation->status,
                        'started_at' => $consultation->started_at,
                        'ended_at' => $consultation->ended_at,
                        'duration_minutes' => $consultation->duration_minutes,
                        'fee_amount' => $consultation->fee_amount,
                        'payment_status' => $consultation->payment_status,
                        'agora_channel' => $consultation->agora_channel,
                        'created_at' => $consultation->created_at,
                        'updated_at' => $consultation->updated_at,
                    ];
                });
            } elseif ($user->role === 'doctor') {
                // Doctor viewing their consultations
                $consultations = Consultation::whereHas('doctor', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                    ->with(['patient', 'payment'])
                    ->orderBy('created_at', 'desc')
                    ->get();

                $consultations->transform(function ($consultation) {
                    return [
                        'id' => $consultation->id,
                        'patient_name' => $consultation->patient->name,
                        'patient_phone' => $consultation->patient->phone,
                        'patient_symptoms' => $consultation->patient_symptoms,
                        'doctor_notes' => $consultation->doctor_notes,
                        'status' => $consultation->status,
                        'started_at' => $consultation->started_at,
                        'ended_at' => $consultation->ended_at,
                        'duration_minutes' => $consultation->duration_minutes,
                        'fee_amount' => $consultation->fee_amount,
                        'payment_status' => $consultation->payment_status,
                        'agora_channel' => $consultation->agora_channel,
                        'created_at' => $consultation->created_at,
                        'updated_at' => $consultation->updated_at,
                    ];
                });
            } else {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            return response()->json([
                'consultations' => $consultations
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching user consultations: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch consultations'
            ], 500);
        }
    }
}