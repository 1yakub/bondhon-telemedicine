<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** A patient's own details. Route middleware (auth, role:patient) already applies. */
class ProfileController extends Controller
{
    public function checkCompletion(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'needs_completion' => ! filled($user->name),
            'user' => new UserResource($user),
        ]);
    }

    public function completeProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,other'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Profile completed successfully',
            'user' => new UserResource($request->user()->fresh()),
        ]);
    }

    public function getProfile(Request $request): JsonResponse
    {
        return response()->json(['user' => new UserResource($request->user())]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'in:male,female,other'],
            'address' => ['nullable', 'string', 'max:500'],
            'profile_photo' => ['nullable', 'string', 'max:255'],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => new UserResource($request->user()->fresh()),
        ]);
    }
}
