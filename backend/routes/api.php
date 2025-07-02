<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\VideoController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// All auth routes need session middleware for cookie handling
Route::middleware(['web'])->prefix('auth')->group(function () {
    Route::post('send-otp', [AuthController::class, 'sendOtp']);
    Route::post('verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('doctor/login', [AuthController::class, 'doctorLogin']);
    Route::post('admin/login', [AuthController::class, 'adminLogin']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'getUser']);
});

// Public Routes (no auth required)
Route::get('doctors', [DoctorController::class, 'index']);

// SSLCOMMERZ Payment Callbacks (public routes)
Route::post('/payments/success', [PaymentController::class, 'success']);
Route::post('/payments/fail', [PaymentController::class, 'fail']);
Route::post('/payments/cancel', [PaymentController::class, 'cancel']);
Route::post('/payments/ipn', [PaymentController::class, 'ipn']);

// Public consultation details (for payment success page)
Route::get('/consultations/public/{transaction_id}', [ConsultationController::class, 'getByTransaction']);

// Protected Routes (auth required) - Use web middleware for session-based auth
Route::middleware(['web', 'auth:web'])->group(function () {

    // Patient Profile Routes
    Route::prefix('profile')->group(function () {
        Route::get('complete', [ProfileController::class, 'checkCompletion']);
        Route::post('complete', [ProfileController::class, 'completeProfile']);
        Route::get('/', [ProfileController::class, 'getProfile']);
        Route::put('/', [ProfileController::class, 'updateProfile']);
    });

    // Doctor Routes
    Route::prefix('doctors')->group(function () {
        Route::put('toggle-status', [DoctorController::class, 'toggleStatus']);
        Route::get('profile', [DoctorController::class, 'getProfile']);
        Route::put('profile', [DoctorController::class, 'updateProfile']);
        Route::put('change-password', [DoctorController::class, 'changePassword']);
    });

    // Consultation Routes
    Route::prefix('consultations')->group(function () {
        Route::get('/', [ConsultationController::class, 'index']); // Patient's consultations
        Route::get('mine', [ConsultationController::class, 'mine']); // For both patients and doctors
        Route::post('/', [ConsultationController::class, 'store']);
        Route::get('{id}', [ConsultationController::class, 'show']);
        Route::delete('{id}', [ConsultationController::class, 'destroy']);
    });

    // Doctor routes (for authenticated doctors)
    Route::get('/doctor/stats', [DoctorController::class, 'stats']);
    Route::post('/doctor/toggle-status', [DoctorController::class, 'toggleStatus']);

    // Admin routes (for authenticated admins)
    Route::get('/admin/stats', [AdminController::class, 'stats']);
    Route::get('/admin/doctors', [AdminController::class, 'doctors']);
    Route::get('/admin/doctors/{id}', [AdminController::class, 'showDoctor']);
    Route::get('/admin/doctors/{id}/consultations', [AdminController::class, 'doctorConsultations']);
    Route::post('/admin/doctors', [AdminController::class, 'createDoctor']);
    Route::put('/admin/doctors/{id}', [AdminController::class, 'updateDoctor']);
    Route::put('/admin/doctors/{id}/password', [AdminController::class, 'resetDoctorPassword']);
    Route::get('/admin/patients', [AdminController::class, 'patients']);
    Route::get('/admin/consultations', [AdminController::class, 'consultations']);
    Route::post('/admin/doctors/{id}/toggle-status', [AdminController::class, 'toggleDoctorStatus']);
    Route::get('/admin/analytics', [AdminController::class, 'analytics']);

    // Payments (for authenticated patients)
    Route::post('/payments/initiate', [PaymentController::class, 'initiate']);
    Route::get('/payments/history', [PaymentController::class, 'history']);

    // Video consultation routes (for authenticated doctors and patients)
    Route::prefix('consultations/{consultation_id}/video')->group(function () {
        Route::post('token', [VideoController::class, 'generateToken']);
        Route::post('start', [VideoController::class, 'startSession']);
        Route::post('end', [VideoController::class, 'endSession']);
        Route::get('status', [VideoController::class, 'getSessionStatus']);
    });

});

// Fallback for API 404s
Route::fallback(function () {
    return response()->json([
        'message' => 'API endpoint not found'
    ], 404);
});
