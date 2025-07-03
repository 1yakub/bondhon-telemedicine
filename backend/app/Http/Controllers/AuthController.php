<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Log;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Send OTP to phone number (patients only)
     * POST /api/auth/send-otp
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|min:11|max:14'
        ]);

        $phone = $request->phone;

        // Generate 6-digit OTP
        $otp = rand(100000, 999999);

        // Store OTP in session for 5 minutes
        Session::put('otp_' . $phone, [
            'code' => $otp,
            'expires_at' => now()->addMinutes(5)
        ]);

        // Send SMS via BulkSMSBD
        $message = "Your Bondhon verification code is: {$otp}. Valid for 5 minutes.";

        try {
            // Check if we should actually send SMS (cost control)
            $shouldSendSMS = env('APP_ENV') === 'production' && env('SMS_ENABLED', true);

            if ($shouldSendSMS) {
                $response = Http::timeout(2)->get(config('sms.bulk_sms_bd.base_url'), [
                    'api_key' => config('sms.bulk_sms_bd.api_key'),
                    'senderid' => config('sms.bulk_sms_bd.sender_id'),
                    'number' => $phone,
                    'message' => $message
                ]);

                if ($response->successful()) {
                    return response()->json([
                        'message' => 'OTP sent successfully',
                        'phone' => $phone
                    ], 200);
                } else {
                    throw new \Exception('SMS service failed');
                }
            } else {
                // Development/Staging mode - don't send real SMS
                Log::info('SMS not sent (staging mode)', [
                    'phone' => $phone,
                    'otp' => $otp,
                    'sms_enabled' => env('SMS_ENABLED', true)
                ]);

                return response()->json([
                    'message' => 'OTP sent successfully (Staging mode)',
                    'phone' => $phone,
                    'debug_otp' => env('APP_DEBUG') ? $otp : null
                ], 200);
            }
        } catch (\Exception $e) {
            Log::error('SMS sending failed', [
                'phone' => $phone,
                'error' => $e->getMessage()
            ]);

            // Fallback for development/staging
            if (env('APP_ENV') === 'local' || env('APP_ENV') === 'development' || !env('SMS_ENABLED', true)) {
                return response()->json([
                    'message' => 'OTP sent successfully (Fallback mode)',
                    'phone' => $phone,
                    'debug_otp' => env('APP_DEBUG') ? $otp : null
                ], 200);
            }

            return response()->json([
                'message' => 'Failed to send OTP',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify OTP and auto-register/login patient
     * POST /api/auth/verify-otp
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'otp' => 'required|string|size:6'
        ]);

        $phone = $request->phone;
        $otp = $request->otp;

        // Check OTP from session
        $storedOtp = Session::get('otp_' . $phone);

        // In development, be more lenient with OTP validation  
        if ((env('APP_ENV') === 'local' || env('APP_ENV') === 'development') && strlen($otp) === 6 && is_numeric($otp)) {
            // Allow any 6-digit OTP in development mode
        } else {
            if (!$storedOtp || !isset($storedOtp['expires_at']) || $storedOtp['expires_at']->isPast()) {
                return response()->json([
                    'message' => 'OTP expired or invalid'
                ], 400);
            }

            if (!isset($storedOtp['code']) || $storedOtp['code'] != $otp) {
                return response()->json([
                    'message' => 'Invalid OTP'
                ], 400);
            }
        }

        // Clear OTP from session
        Session::forget('otp_' . $phone);

        // FirstOrCreate pattern - auto register/login
        $user = User::firstOrCreate(
            ['phone' => $phone],
            ['role' => 'patient']
        );

        // Login the user
        Auth::login($user);

        // Force session save without regeneration
        Session::save();

        // Double-check authentication worked
        if (!Auth::check()) {
            Log::error('Authentication failed after login attempt', [
                'user_id' => $user->id,
                'session_id' => Session::getId()
            ]);
            return response()->json(['message' => 'Authentication failed'], 500);
        }

        // Determine redirect based on profile completion
        $needsProfileCompletion = empty($user->name);

        // Debug information in development
        if (env('APP_ENV') === 'local') {
            Log::info('OTP Login successful', [
                'user_id' => $user->id,
                'session_id' => Session::getId(),
                'auth_check' => Auth::check(),
                'auth_user_id' => Auth::id()
            ]);
        }

        return response()->json([
            'message' => 'Authentication successful',
            'user' => $user,
            'needs_profile_completion' => $needsProfileCompletion,
            'redirect_to' => $needsProfileCompletion
                ? '/patient/complete-profile'
                : '/patient/dashboard',
            'debug' => env('APP_ENV') === 'local' ? [
                'session_id' => Session::getId(),
                'auth_check' => Auth::check()
            ] : null
        ], 200);
    }

    /**
     * Doctor email/password login
     * POST /api/auth/doctor/login
     */
    public function doctorLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $credentials = $request->only('email', 'password');
        $credentials['role'] = 'doctor';

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            return response()->json([
                'message' => 'Login successful',
                'user' => $user->load('doctor'),
                'redirect_to' => '/doctor/dashboard'
            ], 200);
        }

        return response()->json([
            'message' => 'Invalid credentials'
        ], 401);
    }

    /**
     * Admin email/password login
     * POST /api/auth/admin/login
     */
    public function adminLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string'
        ]);

        $credentials = $request->only('email', 'password');
        $credentials['role'] = 'admin';

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            return response()->json([
                'message' => 'Login successful',
                'user' => $user,
                'redirect_to' => '/admin/dashboard'
            ], 200);
        }

        return response()->json([
            'message' => 'Invalid credentials'
        ], 401);
    }

    /**
     * Get authenticated user
     * GET /api/auth/user
     */
    public function getUser(Request $request)
    {
        // Ensure session is properly started
        if (!Session::isStarted()) {
            Session::start();
        }

        // Check if session exists and has authentication data
        $sessionAuth = Session::get('login_web_' . sha1(Auth::class));
        $user = Auth::user();

        // Enhanced debug information in development
        if (env('APP_ENV') === 'local') {
            Log::info('Auth check debug', [
                'headers' => $request->headers->all(),
                'cookies' => $request->cookies->all(),
                'session_id' => Session::getId(),
                'session_auth_key' => $sessionAuth ? 'exists' : 'missing',
                'auth_check' => Auth::check(),
                'auth_id' => Auth::id(),
                'user_exists' => $user ? true : false,
                'session_driver' => config('session.driver'),
                'session_cookie' => config('session.cookie')
            ]);
        }

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated',
                'debug' => env('APP_ENV') === 'local' ? [
                    'session_id' => Session::getId(),
                    'auth_id' => Auth::id(),
                    'session_auth' => $sessionAuth ? 'exists' : 'missing',
                    'cookies_received' => array_keys($request->cookies->all())
                ] : null
            ], 401);
        }

        // Load relationships based on role
        if ($user->role === 'doctor' && method_exists($user, 'doctor')) {
            $user->load('doctor');
        }

        return response()->json([
            'user' => $user
        ], 200);
    }

    /**
     * Logout user
     * POST /api/auth/logout
     */
    public function logout(Request $request)
    {
        Auth::logout();
        Session::flush();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }
}
