<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\DoctorController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VideoController;
use App\Models\Consultation;
use Illuminate\Support\Facades\Route;

/*
| Session based API for the Next.js app (Sanctum SPA style: same site cookie plus
| CSRF token). Every route sits behind the framework mechanism for its risk:
| named rate limiters on sign in, `role` middleware per area, and the
| ConsultationPolicy through `can` for anything that touches one consultation.
*/

Route::middleware('web')->prefix('auth')->group(function () {
    Route::post('send-otp', [AuthController::class, 'sendOtp'])->middleware('throttle:otp-send');
    Route::post('verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp-verify');
    Route::post('doctor/login', [AuthController::class, 'doctorLogin'])->middleware('throttle:login');
    Route::post('admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:login');
    Route::post('logout', [AuthController::class, 'logout']);
    Route::get('user', [AuthController::class, 'user']);
});

// public
Route::get('doctors', [DoctorController::class, 'index']);
Route::get('doctors/{doctor}', [DoctorController::class, 'show']);

// gateway callbacks: server to server, validated by the SSLCommerz validator API
Route::prefix('payments')->name('payments.')->group(function () {
    Route::post('success', [PaymentController::class, 'success'])->name('success');
    Route::post('fail', [PaymentController::class, 'fail'])->name('fail');
    Route::post('cancel', [PaymentController::class, 'cancel'])->name('cancel');
    Route::post('ipn', [PaymentController::class, 'ipn'])->name('ipn');
});

Route::middleware(['web', 'auth:web'])->group(function () {

    // patient
    Route::middleware('role:patient')->group(function () {
        Route::get('profile', [ProfileController::class, 'getProfile']);
        Route::put('profile', [ProfileController::class, 'updateProfile']);
        Route::get('profile/complete', [ProfileController::class, 'checkCompletion']);
        Route::post('profile/complete', [ProfileController::class, 'completeProfile']);

        Route::post('consultations', [ConsultationController::class, 'store'])->can('create', Consultation::class);
        Route::delete('consultations/{consultation}', [ConsultationController::class, 'destroy'])->can('delete', 'consultation');

        Route::post('consultations/{consultation}/pay', [PaymentController::class, 'initiate'])->can('pay', 'consultation');
        Route::get('payments/history', [PaymentController::class, 'history']);
    });

    // patient and doctor
    Route::middleware('role:patient,doctor')->group(function () {
        Route::get('consultations', [ConsultationController::class, 'index'])->can('viewAny', Consultation::class);
        Route::get('consultations/{consultation}', [ConsultationController::class, 'show'])->can('view', 'consultation');

        Route::prefix('consultations/{consultation}/video')->middleware('can:join,consultation')->group(function () {
            Route::post('token', [VideoController::class, 'token']);
            Route::post('start', [VideoController::class, 'start']);
            Route::post('end', [VideoController::class, 'end']);
            Route::get('status', [VideoController::class, 'status']);
        });
    });

    // doctor
    Route::middleware('role:doctor')->prefix('doctor')->group(function () {
        Route::get('stats', [DoctorController::class, 'stats']);
        Route::get('profile', [DoctorController::class, 'getProfile']);
        Route::put('profile', [DoctorController::class, 'updateProfile']);
        Route::post('toggle-status', [DoctorController::class, 'toggleStatus']);
        Route::put('change-password', [DoctorController::class, 'changePassword']);
    });

    // admin
    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('stats', [AdminController::class, 'stats']);
        Route::get('analytics', [AdminController::class, 'analytics']);
        Route::get('doctors', [AdminController::class, 'doctors']);
        Route::post('doctors', [AdminController::class, 'createDoctor']);
        Route::get('doctors/{id}', [AdminController::class, 'showDoctor']);
        Route::put('doctors/{id}', [AdminController::class, 'updateDoctor']);
        Route::put('doctors/{id}/password', [AdminController::class, 'resetDoctorPassword']);
        Route::post('doctors/{id}/toggle-status', [AdminController::class, 'toggleDoctorStatus']);
        Route::get('doctors/{id}/consultations', [AdminController::class, 'doctorConsultations']);
        Route::get('patients', [AdminController::class, 'patients']);
        Route::get('consultations', [AdminController::class, 'consultations']);
    });
});

Route::fallback(fn () => response()->json(['message' => 'Not found.'], 404));
