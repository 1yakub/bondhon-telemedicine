<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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
                        'doctor_name' => $consultation->doctor->name,
                        'doctor_specialization' => $consultation->doctor->doctor->specialization ?? 'General Practice',
                        'patient_symptoms' => $consultation->patient_symptoms,
                        'doctor_notes' => $consultation->doctor_notes,
                        'status' => $this->mapStatus($consultation->payment_status, $consultation->started_at, $consultation->ended_at),
                        'fee_amount' => $consultation->fee_amount,
                        'payment_status' => $consultation->payment_status,
                        'started_at' => $consultation->started_at,
                        'ended_at' => $consultation->ended_at,
                        'duration_minutes' => $consultation->duration_minutes,
                        'created_at' => $consultation->created_at,
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
}