<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class ProfileController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Check if profile completion is needed
     * GET /api/profile/complete
     */
    public function checkCompletion(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json([
                'message' => 'Only patients need profile completion'
            ], 403);
        }

        $needsCompletion = empty($user->name);

        return response()->json([
            'needs_completion' => $needsCompletion,
            'user' => $user
        ], 200);
    }

    /**
     * Complete patient profile
     * POST /api/profile/complete
     */
    public function completeProfile(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json([
                'message' => 'Only patients can complete profile'
            ], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string|max:500'
        ]);

        $user->update([
            'name' => $request->name,
            'date_of_birth' => $request->date_of_birth,
            'gender' => $request->gender,
            'address' => $request->address,
        ]);

        return response()->json([
            'message' => 'Profile completed successfully',
            'user' => $user->fresh(),
            'redirect_to' => '/patient/dashboard'
        ], 200);
    }

    /**
     * Get patient profile
     * GET /api/profile
     */
    public function getProfile(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json([
                'message' => 'Only patients have profiles'
            ], 403);
        }

        return response()->json([
            'user' => $user
        ], 200);
    }

    /**
     * Update patient profile
     * PUT /api/profile
     */
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        if ($user->role !== 'patient') {
            return response()->json([
                'message' => 'Only patients can update profile'
            ], 403);
        }

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'date_of_birth' => 'nullable|date|before:today',
            'gender' => 'nullable|in:male,female,other',
            'address' => 'nullable|string|max:500',
            'profile_photo' => 'nullable|string|max:255'
        ]);

        $user->update($request->only([
            'name',
            'date_of_birth',
            'gender',
            'address',
            'profile_photo'
        ]));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh()
        ], 200);
    }
}
