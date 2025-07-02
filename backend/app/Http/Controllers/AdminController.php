<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use App\Models\Payment;

class AdminController extends Controller
{
    /**
     * Get admin dashboard statistics
     * GET /api/admin/stats
     */
    public function stats(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get total counts
            $totalDoctors = User::where('role', 'doctor')->count();
            $totalPatients = User::where('role', 'patient')->count();
            $totalConsultations = Consultation::count();
            $onlineDoctors = Doctor::where('is_online', true)->count();
            $pendingConsultations = Consultation::where('payment_status', 'pending')->count();

            // Calculate total revenue from paid consultations
            $totalRevenue = Payment::where('ssl_status', 'VALID')->sum('amount');

            return response()->json([
                'stats' => [
                    'total_doctors' => $totalDoctors,
                    'total_patients' => $totalPatients,
                    'total_consultations' => $totalConsultations,
                    'total_revenue' => $totalRevenue,
                    'online_doctors' => $onlineDoctors,
                    'pending_consultations' => $pendingConsultations,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching admin stats: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Get all doctors for admin management
     * GET /api/admin/doctors
     */
    public function doctors(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $doctors = Doctor::with([
                'user' => function ($query) {
                    $query->select('id', 'name', 'email', 'phone', 'created_at');
                }
            ])
                ->get()
                ->map(function ($doctor) {
                    return [
                        'id' => $doctor->id,
                        'user_id' => $doctor->user_id,
                        'name' => $doctor->user->name,
                        'email' => $doctor->user->email,
                        'phone' => $doctor->user->phone,
                        'specialization' => $doctor->specialization,
                        'qualifications' => $doctor->qualifications,
                        'experience_years' => $doctor->experience_years,
                        'fee_per_consultation' => $doctor->fee_per_consultation,
                        'is_online' => $doctor->is_online,
                        'created_at' => $doctor->user->created_at,
                    ];
                });

            return response()->json([
                'doctors' => $doctors
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching doctors for admin: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch doctors'
            ], 500);
        }
    }

    /**
     * Get all consultations for admin oversight
     * GET /api/admin/consultations
     */
    public function consultations(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $consultations = Consultation::with(['patient', 'doctor.doctor', 'payment'])
                ->orderBy('created_at', 'desc')
                ->limit(50) // Show latest 50 consultations
                ->get()
                ->map(function ($consultation) {
                    return [
                        'id' => $consultation->id,
                        'patient_name' => $consultation->patient->name,
                        'patient_phone' => $consultation->patient->phone,
                        'patient_gender' => $consultation->patient->gender,
                        'doctor_name' => $consultation->doctor->name,
                        'doctor_specialization' => $consultation->doctor->doctor->specialization ?? 'General Practice',
                        'patient_symptoms' => $consultation->patient_symptoms,
                        'doctor_notes' => $consultation->doctor_notes,
                        'status' => $this->mapStatus($consultation->payment_status, $consultation->started_at, $consultation->ended_at),
                        'fee_amount' => $consultation->fee_amount,
                        'payment_status' => $consultation->payment_status,
                        'payment_amount' => $consultation->payment ? $consultation->payment->amount : null,
                        'ssl_payment_status' => $consultation->payment ? $consultation->payment->ssl_status : null,
                        'transaction_id' => $consultation->payment ? $consultation->payment->ssl_transaction_id : null,
                        'started_at' => $consultation->started_at,
                        'ended_at' => $consultation->ended_at,
                        'duration_minutes' => $consultation->duration_minutes,
                        'created_at' => $consultation->created_at,
                        'updated_at' => $consultation->updated_at,
                    ];
                });

            return response()->json([
                'consultations' => $consultations
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching consultations for admin: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch consultations'
            ], 500);
        }
    }

    /**
     * Toggle doctor online/offline status (Admin action)
     * POST /api/admin/doctors/{id}/toggle-status
     */
    public function toggleDoctorStatus(Request $request, $id)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $doctor = Doctor::find($id);

            if (!$doctor) {
                return response()->json(['message' => 'Doctor not found'], 404);
            }

            // Toggle the online status
            $doctor->is_online = !$doctor->is_online;
            $doctor->save();

            // Get doctor name for logging
            $doctorUser = User::find($doctor->user_id);
            $doctorName = $doctorUser ? $doctorUser->name : 'Unknown';

            Log::info("Admin {$user->name} changed doctor {$doctorName} status to: " . ($doctor->is_online ? 'Online' : 'Offline'));

            return response()->json([
                'is_online' => $doctor->is_online,
                'message' => "Doctor status updated to " . ($doctor->is_online ? 'Online' : 'Offline')
            ]);

        } catch (\Exception $e) {
            Log::error('Error toggling doctor status by admin: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update doctor status'
            ], 500);
        }
    }

    /**
     * Get platform analytics for admin
     * GET /api/admin/analytics
     */
    public function analytics(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get consultations by payment status (since status column doesn't exist)
            $consultationsByStatus = Consultation::selectRaw('payment_status, COUNT(*) as count')
                ->groupBy('payment_status')
                ->get()
                ->pluck('count', 'payment_status');

            // Get consultations by month (last 6 months)
            $consultationsByMonth = Consultation::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
                ->where('created_at', '>=', now()->subMonths(6))
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // Get revenue by month
            $revenueByMonth = Payment::selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, SUM(amount) as total')
                ->where('ssl_status', 'VALID')
                ->where('created_at', '>=', now()->subMonths(6))
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            // Top doctors by consultation count
            $topDoctors = Consultation::selectRaw('doctor_id, COUNT(*) as consultation_count')
                ->with(['doctor:id,name'])
                ->groupBy('doctor_id')
                ->orderBy('consultation_count', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($item) {
                    return [
                        'doctor_name' => $item->doctor->name,
                        'consultation_count' => $item->consultation_count,
                    ];
                });

            return response()->json([
                'analytics' => [
                    'consultations_by_status' => $consultationsByStatus,
                    'consultations_by_month' => $consultationsByMonth,
                    'revenue_by_month' => $revenueByMonth,
                    'top_doctors' => $topDoctors,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching admin analytics: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch analytics'
            ], 500);
        }
    }

    /**
     * Map internal status to frontend status
     * Priority: payment_status first, then consultation progress
     */
    private function mapStatus($paymentStatus, $startedAt, $endedAt)
    {
        // Payment status is PRIMARY factor
        if ($paymentStatus === 'failed') {
            return 'cancelled';
        }

        if ($paymentStatus === 'pending') {
            return 'pending';  // Always pending if not paid (regardless of scheduled time)
        }

        // Only if payment is successful, then check consultation progress
        if ($paymentStatus === 'paid') {
            if ($endedAt) {
                return 'completed';  // Paid, started, and ended
            }
            if ($startedAt) {
                return 'in_progress';  // Paid, started, but not ended
            }
            return 'confirmed';  // Paid but not started yet
        }

        // Fallback
        return 'pending';
    }

    /**
     * Create new doctor account (Admin action)
     * POST /api/admin/doctors
     */
    public function createDoctor(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Validate required fields only
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'phone' => 'nullable|string|unique:users,phone',
                'gender' => 'nullable|in:male,female,other',
                'specialization' => 'nullable|string|max:255',
                'qualifications' => 'nullable|string',
                'experience_years' => 'nullable|integer|min:0|max:50',
                'fee_per_consultation' => 'nullable|numeric|min:0|max:10000',
            ]);

            // Create both User and Doctor records atomically
            $result = DB::transaction(function () use ($validated) {
                // Create User record
                $doctorUser = User::create([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? null,
                    'password' => Hash::make($validated['password']),
                    'role' => 'doctor',
                    'gender' => $validated['gender'] ?? null,
                ]);

                // Create Doctor record with defaults
                $doctor = Doctor::create([
                    'user_id' => $doctorUser->id,
                    'specialization' => $validated['specialization'] ?? 'General Practice',
                    'qualifications' => $validated['qualifications'] ?? null,
                    'experience_years' => $validated['experience_years'] ?? 0,
                    'fee_per_consultation' => $validated['fee_per_consultation'] ?? 500.00,
                    'is_online' => false, // New doctors start offline
                ]);

                return $doctorUser->load('doctor');
            });

            Log::info("Admin {$user->name} created new doctor account for: {$validated['name']} ({$validated['email']})");

            return response()->json([
                'message' => 'Doctor account created successfully',
                'doctor' => $result,
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error creating doctor account: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to create doctor account'
            ], 500);
        }
    }

    /**
     * Update doctor details (Admin action)
     * PUT /api/admin/doctors/{id}
     */
    public function updateDoctor(Request $request, $id)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $doctor = Doctor::with('user')->find($id);

            if (!$doctor) {
                return response()->json(['message' => 'Doctor not found'], 404);
            }

            // Validate update fields
            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $doctor->user_id,
                'phone' => 'nullable|string|unique:users,phone,' . $doctor->user_id,
                'gender' => 'nullable|in:male,female,other',
                'specialization' => 'sometimes|required|string|max:255',
                'qualifications' => 'nullable|string',
                'experience_years' => 'sometimes|required|integer|min:0|max:50',
                'fee_per_consultation' => 'sometimes|required|numeric|min:0|max:10000',
            ]);

            // Update both records atomically
            DB::transaction(function () use ($validated, $doctor) {
                // Update User fields if provided
                $userFields = array_intersect_key($validated, array_flip(['name', 'email', 'phone', 'gender']));
                if (!empty($userFields)) {
                    $doctor->user->update($userFields);
                }

                // Update Doctor fields if provided
                $doctorFields = array_intersect_key($validated, array_flip(['specialization', 'qualifications', 'experience_years', 'fee_per_consultation']));
                if (!empty($doctorFields)) {
                    $doctor->update($doctorFields);
                }
            });

            Log::info("Admin {$user->name} updated doctor details for: {$doctor->user->name}");

            return response()->json([
                'message' => 'Doctor details updated successfully',
                'doctor' => $doctor->fresh(['user']),
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating doctor details: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update doctor details'
            ], 500);
        }
    }

    /**
     * Reset doctor password (Admin action)
     * PUT /api/admin/doctors/{id}/password
     */
    public function resetDoctorPassword(Request $request, $id)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $doctor = Doctor::with('user')->find($id);

            if (!$doctor) {
                return response()->json(['message' => 'Doctor not found'], 404);
            }

            // Validate new password
            $validated = $request->validate([
                'new_password' => 'required|string|min:6',
            ]);

            // Update password
            $doctor->user->update([
                'password' => Hash::make($validated['new_password'])
            ]);

            Log::info("Admin {$user->name} reset password for doctor: {$doctor->user->name}");

            return response()->json([
                'message' => 'Doctor password reset successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Error resetting doctor password: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to reset doctor password'
            ], 500);
        }
    }

    /**
     * Get all patients for admin overview
     * GET /api/admin/patients
     */
    public function patients(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $patients = User::where('role', 'patient')
                ->with(['patientConsultations.payment', 'patientConsultations.doctor.doctor'])
                ->withCount('patientConsultations')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($patient) {
                    // Calculate patient age from date_of_birth
                    $age = null;
                    if ($patient->date_of_birth) {
                        $age = \Carbon\Carbon::parse($patient->date_of_birth)->age;
                    }

                    // Get consultation summary
                    $consultations = $patient->patientConsultations;
                    $totalConsultations = $consultations->count();

                    // Calculate total spent from successful payments
                    $totalSpent = $consultations->filter(function ($consultation) {
                        return $consultation->payment && $consultation->payment->ssl_status === 'VALID';
                    })->sum(function ($consultation) {
                        return $consultation->payment ? $consultation->payment->amount : 0;
                    });

                    // Find most consulted doctor
                    $doctorCounts = [];
                    foreach ($consultations as $consultation) {
                        if ($consultation->doctor) {
                            $doctorName = $consultation->doctor->name;
                            $doctorCounts[$doctorName] = ($doctorCounts[$doctorName] ?? 0) + 1;
                        }
                    }
                    $favoriteDoctor = !empty($doctorCounts)
                        ? array_keys($doctorCounts, max($doctorCounts))[0]
                        : null;

                    // Last consultation date
                    $lastConsultation = $consultations->sortByDesc('created_at')->first();
                    $lastConsultationDate = $lastConsultation ? $lastConsultation->created_at : null;

                    // Determine activity status (active if consulted in last 30 days)
                    $isActive = $lastConsultationDate &&
                        \Carbon\Carbon::parse($lastConsultationDate)->diffInDays(now()) <= 30;

                    return [
                        'id' => $patient->id,
                        'name' => $patient->name,
                        'phone' => $patient->phone,
                        'email' => $patient->email,
                        'gender' => $patient->gender,
                        'age' => $age,
                        'address' => $patient->address,
                        'profile_complete' => !empty($patient->name),
                        'registration_date' => $patient->created_at,
                        'last_consultation_date' => $lastConsultationDate,
                        'total_consultations' => $totalConsultations,
                        'total_spent' => $totalSpent,
                        'favorite_doctor' => $favoriteDoctor,
                        'is_active' => $isActive,
                        'status' => $isActive ? 'active' : 'inactive',
                    ];
                });

            return response()->json([
                'patients' => $patients
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching patients for admin: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch patients'
            ], 500);
        }
    }

    /**
     * Get individual doctor details for admin management
     * GET /api/admin/doctors/{id}
     */
    public function showDoctor(Request $request, $id)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $doctor = Doctor::with([
                'user' => function ($query) {
                    $query->select('id', 'name', 'email', 'phone', 'gender', 'date_of_birth', 'address', 'profile_photo', 'created_at', 'updated_at');
                }
            ])->find($id);

            if (!$doctor) {
                return response()->json(['message' => 'Doctor not found'], 404);
            }

            // Get consultation statistics
            $totalConsultations = Consultation::where('doctor_id', $doctor->user_id)->count();
            $completedConsultations = Consultation::where('doctor_id', $doctor->user_id)
                ->whereNotNull('ended_at')
                ->count();

            // Calculate total revenue from valid payments
            $totalRevenue = Payment::whereHas('consultation', function ($query) use ($doctor) {
                $query->where('doctor_id', $doctor->user_id);
            })->where('ssl_status', 'VALID')->sum('amount');

            // Calculate average consultation duration
            $avgDuration = Consultation::where('doctor_id', $doctor->user_id)
                ->whereNotNull('duration_minutes')
                ->avg('duration_minutes');

            // Recent consultations count (last 30 days)
            $recentConsultations = Consultation::where('doctor_id', $doctor->user_id)
                ->where('created_at', '>=', now()->subDays(30))
                ->count();

            // Calculate age from date_of_birth
            $age = null;
            if ($doctor->user->date_of_birth) {
                $age = \Carbon\Carbon::parse($doctor->user->date_of_birth)->age;
            }

            return response()->json([
                'doctor' => [
                    'id' => $doctor->id,
                    'user_id' => $doctor->user_id,
                    'name' => $doctor->user->name,
                    'email' => $doctor->user->email,
                    'phone' => $doctor->user->phone,
                    'gender' => $doctor->user->gender,
                    'age' => $age,
                    'date_of_birth' => $doctor->user->date_of_birth,
                    'address' => $doctor->user->address,
                    'profile_photo' => $doctor->user->profile_photo,
                    'specialization' => $doctor->specialization,
                    'qualifications' => $doctor->qualifications,
                    'experience_years' => $doctor->experience_years,
                    'fee_per_consultation' => $doctor->fee_per_consultation,
                    'is_online' => $doctor->is_online,
                    'created_at' => $doctor->user->created_at,
                    'updated_at' => $doctor->user->updated_at,
                    'statistics' => [
                        'total_consultations' => $totalConsultations,
                        'completed_consultations' => $completedConsultations,
                        'total_revenue' => $totalRevenue,
                        'average_duration_minutes' => round($avgDuration, 2),
                        'recent_consultations_30_days' => $recentConsultations,
                        'completion_rate' => $totalConsultations > 0 ? round(($completedConsultations / $totalConsultations) * 100, 2) : 0,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching doctor details for admin: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch doctor details'
            ], 500);
        }
    }

    /**
     * Get doctor's consultation history and analytics
     * GET /api/admin/doctors/{id}/consultations
     */
    public function doctorConsultations(Request $request, $id)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $doctor = Doctor::find($id);

            if (!$doctor) {
                return response()->json(['message' => 'Doctor not found'], 404);
            }

            // Get consultations with related data
            $consultations = Consultation::with(['patient', 'payment'])
                ->where('doctor_id', $doctor->user_id)
                ->orderBy('created_at', 'desc')
                ->limit(50) // Latest 50 consultations
                ->get()
                ->map(function ($consultation) {
                    return [
                        'id' => $consultation->id,
                        'patient_name' => $consultation->patient->name,
                        'patient_phone' => $consultation->patient->phone,
                        'patient_symptoms' => $consultation->patient_symptoms,
                        'doctor_notes' => $consultation->doctor_notes,
                        'fee_amount' => $consultation->fee_amount,
                        'duration_minutes' => $consultation->duration_minutes,
                        'status' => $this->mapStatus($consultation->payment_status, $consultation->started_at, $consultation->ended_at),
                        'payment_status' => $consultation->payment_status,
                        'payment_amount' => $consultation->payment ? $consultation->payment->amount : null,
                        'ssl_payment_status' => $consultation->payment ? $consultation->payment->ssl_status : null,
                        'transaction_id' => $consultation->payment ? $consultation->payment->ssl_transaction_id : null,
                        'started_at' => $consultation->started_at,
                        'ended_at' => $consultation->ended_at,
                        'created_at' => $consultation->created_at,
                    ];
                });

            // Monthly consultation statistics (last 12 months)
            $monthlyStats = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $monthKey = $date->format('Y-m');
                $monthName = $date->format('M Y');

                $monthConsultations = Consultation::where('doctor_id', $doctor->user_id)
                    ->whereYear('created_at', $date->year)
                    ->whereMonth('created_at', $date->month)
                    ->count();

                $monthRevenue = Payment::whereHas('consultation', function ($query) use ($doctor, $date) {
                    $query->where('doctor_id', $doctor->user_id)
                        ->whereYear('created_at', $date->year)
                        ->whereMonth('created_at', $date->month);
                })->where('ssl_status', 'VALID')->sum('amount');

                $monthlyStats[] = [
                    'month' => $monthName,
                    'consultations' => $monthConsultations,
                    'revenue' => $monthRevenue,
                ];
            }

            return response()->json([
                'consultations' => $consultations,
                'monthly_statistics' => $monthlyStats,
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching doctor consultations for admin: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch doctor consultations'
            ], 500);
        }
    }
}