<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Http\Resources\UserResource;
use App\Models\Doctor;
use App\Models\User;
use App\Models\Consultation;
use App\Models\Payment;
use Illuminate\Support\Facades\Log;

class DoctorController extends Controller
{
    /**
     * Get public list of doctors (no auth required)
     * GET /api/doctors
     */
    public function index(Request $request)
    {
        $doctors = Doctor::with([
            'user' => function ($query) {
                $query->select('id', 'name', 'profile_photo', 'gender');
            }
        ])
            ->select('user_id', 'specialization', 'experience_years', 'fee_per_consultation', 'is_online')
            ->get()
            ->map(function ($doctor) {
                return [
                    'id' => $doctor->user_id,
                    'name' => $doctor->user->name,
                    'profile_photo' => $doctor->user->profile_photo,
                    'gender' => $doctor->user->gender,
                    'specialization' => $doctor->specialization,
                    'experience_years' => $doctor->experience_years,
                    'fee_per_consultation' => $doctor->fee_per_consultation,
                    'is_online' => $doctor->is_online,
                ];
            });

        return response()->json([
            'doctors' => $doctors
        ], 200);
    }

    /**
     * Toggle doctor online/offline status
     * PUT /api/doctors/toggle-status
     */
    public function show(Doctor $doctor)
    {
        return new \App\Http\Resources\DoctorResource($doctor->load('user'));
    }

    public function toggleStatus(Request $request)
    {
        try {
            $user = $request->user();


            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['message' => 'Doctor profile not found'], 404);
            }

            // Toggle the online status
            $doctor->is_online = !$doctor->is_online;
            $doctor->save();

            Log::info("Doctor {$user->name} status changed to: " . ($doctor->is_online ? 'Online' : 'Offline'));

            return response()->json([
                'is_online' => $doctor->is_online,
                'message' => $doctor->is_online ? 'You are now online' : 'You are now offline'
            ]);

        } catch (\Exception $e) {
            Log::error('Error toggling doctor status: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to update status'
            ], 500);
        }
    }

    /**
     * Get doctor profile
     * GET /api/doctors/profile
     */
    public function getProfile(Request $request)
    {
        $user = Auth::user();


        $user->load('doctor');

        return response()->json([
            'user' => new UserResource($user->loadMissing('doctor'))
        ], 200);
    }

    /**
     * Update doctor profile
     * PUT /api/doctors/profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();


        // Validate user fields
        $userValidation = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'profile_photo' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'date_of_birth' => 'nullable|date|before:today',
        ]);

        // Validate doctor fields
        $doctorValidation = $request->validate([
            'specialization' => 'sometimes|required|string|max:255',
            'qualifications' => 'nullable|string',
            'experience_years' => 'sometimes|required|integer|min:0|max:50',
            'fee_per_consultation' => 'sometimes|required|numeric|min:0|max:10000',
        ]);

        // Update user fields
        if (!empty($userValidation)) {
            $user->update(array_filter($userValidation));
        }

        // Update doctor fields
        if (!empty($doctorValidation)) {
            $user->doctor->update(array_filter($doctorValidation));
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($user->load('doctor'))
        ], 200);
    }

    public function stats(Request $request)
    {
        try {
            $user = $request->user();


            $doctor = Doctor::where('user_id', $user->id)->first();

            if (!$doctor) {
                return response()->json(['message' => 'Doctor profile not found'], 404);
            }

            // Get consultation statistics (using user_id as foreign key)
            $totalConsultations = Consultation::where('doctor_id', $user->id)->count();
            $pendingConsultations = Consultation::where('doctor_id', $user->id)
                ->where('payment_status', 'pending')
                ->count();
            $completedConsultations = Consultation::where('doctor_id', $user->id)
                ->where('payment_status', 'paid')
                ->whereNotNull('ended_at')
                ->count();

            // Calculate total earnings from valid payments (same as admin revenue logic)
            $totalEarnings = Payment::whereHas('consultation', function ($query) use ($user) {
                $query->where('doctor_id', $user->id);
            })
                ->where('ssl_status', 'VALID')
                ->sum('amount');

            return response()->json([
                'stats' => [
                    'total_consultations' => $totalConsultations,
                    'pending_consultations' => $pendingConsultations,
                    'completed_consultations' => $completedConsultations,
                    'total_earnings' => $totalEarnings,
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching doctor stats: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch statistics'
            ], 500);
        }
    }

    /**
     * Change doctor password
     * PUT /api/doctors/change-password
     */
    public function changePassword(Request $request)
    {
        try {
            $user = Auth::user();


            // Validate password change request
            $validated = $request->validate([
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:6',
                'new_password_confirmation' => 'required|string|same:new_password',
            ]);

            // Check current password
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            $user->update([
                'password' => Hash::make($validated['new_password'])
            ]);

            Log::info("Doctor {$user->name} changed their password");

            return response()->json([
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error changing doctor password: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to change password'
            ], 500);
        }
    }
}
