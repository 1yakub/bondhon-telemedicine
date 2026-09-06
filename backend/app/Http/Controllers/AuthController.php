<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\SendOtpRequest;
use App\Http\Requests\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Session sign in, the way the Laravel authentication docs describe it:
 * Auth::attempt or Auth::login, then session()->regenerate() against fixation,
 * and invalidate() plus regenerateToken() on logout. Brute force is handled by the
 * named rate limiters on the routes, not here.
 */
class AuthController extends Controller
{
    public function __construct(private readonly OtpService $otp) {}

    public function sendOtp(SendOtpRequest $request): JsonResponse
    {
        $code = $this->otp->issue($request->phone());

        return response()->json([
            'message' => 'We sent a 6 digit code to your phone.',
            'phone' => $request->phone(),
            // only present in demo and local, where no SMS is sent
            'demo_code' => $code,
        ]);
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        if (! $this->otp->verify($request->phone(), $request->input('otp'))) {
            throw ValidationException::withMessages([
                'otp' => 'That code is wrong or has expired. Ask for a new one.',
            ]);
        }

        $user = User::firstOrCreate(['phone' => $request->phone()], ['role' => 'patient']);

        if ($user->role !== 'patient') {
            // doctors and admins sign in with a password on their own pages
            throw ValidationException::withMessages(['phone' => 'Use the staff sign in for this account.']);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['user' => new UserResource($user)]);
    }

    public function doctorLogin(LoginRequest $request): JsonResponse
    {
        return $this->passwordLogin($request, 'doctor');
    }

    public function adminLogin(LoginRequest $request): JsonResponse
    {
        return $this->passwordLogin($request, 'admin');
    }

    public function user(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return response()->json(['user' => new UserResource($user->loadMissing('doctor'))]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    private function passwordLogin(LoginRequest $request, string $role): JsonResponse
    {
        $credentials = $request->only('email', 'password') + ['role' => $role];

        if (! Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => 'These sign in details do not match our records.',
            ]);
        }

        $request->session()->regenerate();

        return response()->json(['user' => new UserResource($request->user()->loadMissing('doctor'))]);
    }
}
