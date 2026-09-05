<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\Consultation;
use App\Models\Payment;
use App\Models\User;

class PaymentController extends Controller
{
    /**
     * Initiate payment for a consultation
     * POST /api/payments/initiate
     */
    public function initiate(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'patient') {
                return response()->json(['message' => 'Only patients can make payments'], 403);
            }

            $request->validate([
                'consultation_id' => 'required|exists:consultations,id',
            ]);

            $consultation = Consultation::with(['doctor', 'patient'])->find($request->consultation_id);

            // Check if patient owns this consultation
            if ($consultation->patient_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Check if payment already exists and is successful
            $existingPayment = Payment::where('consultation_id', $consultation->id)
                ->where('ssl_status', 'VALID')
                ->first();

            if ($existingPayment) {
                return response()->json(['message' => 'Payment already completed for this consultation'], 400);
            }

            // SSLCOMMERZ configuration
            $sslc_data = [
                'store_id' => config('services.sslcommerz.store_id'),
                'store_passwd' => config('services.sslcommerz.store_password'),
                'total_amount' => $consultation->fee_amount,
                'currency' => 'BDT',
                'tran_id' => 'BONDHON_' . $consultation->id . '_' . time(),
                'success_url' => config('app.url') . '/api/payments/success',
                'fail_url' => config('app.url') . '/api/payments/fail',
                'cancel_url' => config('app.url') . '/api/payments/cancel',
                'ipn_url' => config('app.url') . '/api/payments/ipn',

                // Customer Information
                'cus_name' => $user->name,
                'cus_email' => $user->email ?? $user->phone . '@bondhon.com',
                'cus_add1' => $user->address ?? 'Dhaka, Bangladesh',
                'cus_add2' => '',
                'cus_city' => 'Dhaka',
                'cus_state' => 'Dhaka',
                'cus_postcode' => '1000',
                'cus_country' => 'Bangladesh',
                'cus_phone' => $user->phone,
                'cus_fax' => '',

                // Shipment Information
                'ship_name' => $user->name,
                'ship_add1' => $user->address ?? 'Dhaka, Bangladesh',
                'ship_add2' => '',
                'ship_city' => 'Dhaka',
                'ship_state' => 'Dhaka',
                'ship_postcode' => '1000',
                'ship_country' => 'Bangladesh',
                'ship_phone' => $user->phone,

                // Product Information
                'product_name' => 'Medical Consultation with Dr. ' . $consultation->doctor->name,
                'product_category' => 'Healthcare',
                'product_profile' => 'general',

                // Shipping Information (Required by SSLCOMMERZ)
                'shipping_method' => 'NO', // No physical shipping for digital service

                // Additional Information
                'value_a' => $consultation->id, // Store consultation ID for reference
                'value_b' => $user->id, // Store patient ID for reference
                'value_c' => $consultation->doctor_id, // Store doctor ID for reference
                'value_d' => '',
            ];

            // Store payment record with user session info
            $payment = Payment::create([
                'consultation_id' => $consultation->id,
                'amount' => $consultation->fee_amount,
                'ssl_transaction_id' => $sslc_data['tran_id'],
                'ssl_status' => 'PENDING',
            ]);

            // Store user session info for restoration after payment
            session(['payment_user_id' => $user->id]);
            session(['payment_session_backup' => session()->getId()]);

            Log::info('Payment initiated - storing session info', [
                'user_id' => $user->id,
                'session_id' => session()->getId(),
                'transaction_id' => $sslc_data['tran_id']
            ]);

            // Determine SSLCOMMERZ endpoint based on environment
            $sslc_endpoint = config('services.sslcommerz.sandbox')
                ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
                : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

            // Make request to SSLCOMMERZ
            $response = Http::withOptions([
                'verify' => config('app.env') === 'production', // Only verify SSL in production
            ])->asForm()->post($sslc_endpoint, $sslc_data);

            if ($response->successful()) {
                $responseData = $response->json();

                if ($responseData['status'] === 'SUCCESS') {
                    Log::info('SSLCOMMERZ payment initiated successfully', [
                        'transaction_id' => $sslc_data['tran_id'],
                        'consultation_id' => $consultation->id,
                        'amount' => $consultation->fee_amount
                    ]);

                    return response()->json([
                        'status' => 'success',
                        'payment_url' => $responseData['GatewayPageURL'],
                        'transaction_id' => $sslc_data['tran_id'],
                        'amount' => $consultation->fee_amount,
                        'session_key' => $responseData['sessionkey'] ?? null,
                    ]);
                } else {
                    Log::error('SSLCOMMERZ payment initiation failed', $responseData);
                    return response()->json([
                        'message' => 'Payment gateway error: ' . ($responseData['failedreason'] ?? 'Unknown error')
                    ], 400);
                }
            } else {
                Log::error('Failed to connect to SSLCOMMERZ', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return response()->json([
                    'message' => 'Payment gateway connection failed'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Payment initiation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Payment initiation failed'
            ], 500);
        }
    }

    /**
     * Handle SSLCOMMERZ success callback
     * POST /api/payments/success
     */
    public function success(Request $request)
    {
        try {
            $tran_id = $request->input('tran_id');
            $val_id = $request->input('val_id');
            $status = $request->input('status');
            $amount = $request->input('amount');

            Log::info('SSLCOMMERZ success callback received', $request->all());

            if ($status === 'VALID') {
                // For sandbox/test mode, we can trust SSLCOMMERZ callback
                // For production, we should always validate server-to-server
                if (config('services.sslcommerz.sandbox')) {
                    Log::info('Using simplified validation for test mode');
                    $validation = ['status' => 'VALID', 'amount' => $amount];
                } else {
                    // Validate the transaction with SSLCOMMERZ for production
                    $validation = $this->validateTransaction($val_id, $amount);
                }

                if ($validation['status'] === 'VALID') {
                    // Update payment record
                    $payment = Payment::where('ssl_transaction_id', $tran_id)->first();

                    if ($payment) {
                        $payment->update([
                            'ssl_status' => 'VALID',
                            'paid_at' => now(),
                        ]);

                        // Update consultation payment status
                        $consultation = Consultation::find($payment->consultation_id);
                        if ($consultation) {
                            // Generate agora channel if not exists
                            if (!$consultation->agora_channel) {
                                $consultation->agora_channel = 'consultation_' . $consultation->id . '_' . time();
                            }

                            $consultation->update([
                                'payment_status' => 'paid',
                                'status' => 'confirmed', // Move from pending to confirmed
                                'agora_channel' => $consultation->agora_channel
                            ]);
                        }

                        Log::info('Payment completed successfully', [
                            'transaction_id' => $tran_id,
                            'consultation_id' => $payment->consultation_id,
                            'amount' => $amount
                        ]);

                        // Try to restore user session if available
                        $consultation = Consultation::find($payment->consultation_id);
                        if ($consultation && $consultation->patient_id) {
                            // Re-authenticate the user to restore session
                            Auth::loginUsingId($consultation->patient_id);

                            Log::info('Session restored after payment', [
                                'user_id' => $consultation->patient_id,
                                'new_session_id' => session()->getId(),
                                'transaction_id' => $tran_id
                            ]);
                        }

                        // Redirect to frontend success page
                        return redirect(config('app.frontend_url') . '/payment/success?' . http_build_query([
                            'tran_id' => $tran_id,
                            'amount' => $amount,
                            'status' => 'VALID',
                            'consultation_id' => $payment->consultation_id,
                            'restored_session' => 'true'
                        ]));
                    }
                }
            }

            // Redirect to frontend failure page
            return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                'tran_id' => $tran_id,
                'amount' => $amount,
                'status' => 'FAILED',
                'failedreason' => 'Payment validation failed'
            ]));

        } catch (\Exception $e) {
            Log::error('Payment success callback error: ' . $e->getMessage());
            // Redirect to frontend failure page
            return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                'tran_id' => $request->input('tran_id'),
                'amount' => $request->input('amount'),
                'status' => 'ERROR',
                'failedreason' => 'Payment processing error'
            ]));
        }
    }

    /**
     * Handle SSLCOMMERZ failure callback
     * POST /api/payments/fail
     */
    public function fail(Request $request)
    {
        try {
            $tran_id = $request->input('tran_id');

            Log::info('SSLCOMMERZ failure callback received', $request->all());

            // Update payment record
            $payment = Payment::where('ssl_transaction_id', $tran_id)->first();
            if ($payment) {
                $payment->update([
                    'ssl_status' => 'FAILED',
                ]);

                // Try to restore user session if available (same as success method)
                $consultation = Consultation::find($payment->consultation_id);
                if ($consultation && $consultation->patient_id) {
                    // Re-authenticate the user to restore session
                    Auth::loginUsingId($consultation->patient_id);

                    Log::info('Session restored after payment failure', [
                        'user_id' => $consultation->patient_id,
                        'new_session_id' => session()->getId(),
                        'transaction_id' => $tran_id
                    ]);

                    // Redirect to frontend failure page with session restored flag
                    return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                        'tran_id' => $tran_id,
                        'amount' => $request->input('amount'),
                        'status' => 'FAILED',
                        'failedreason' => 'Payment was declined or failed',
                        'consultation_id' => $payment->consultation_id,
                        'restored_session' => 'true'
                    ]));
                }
            }

            // Redirect to frontend failure page (without session restoration)
            return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                'tran_id' => $tran_id,
                'amount' => $request->input('amount'),
                'status' => 'FAILED',
                'failedreason' => 'Payment was declined or failed'
            ]));

        } catch (\Exception $e) {
            Log::error('Payment failure callback error: ' . $e->getMessage());
            // Redirect to frontend failure page
            return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                'tran_id' => $request->input('tran_id'),
                'amount' => $request->input('amount'),
                'status' => 'ERROR',
                'failedreason' => 'Payment processing error'
            ]));
        }
    }

    /**
     * Handle SSLCOMMERZ cancellation callback
     * POST /api/payments/cancel
     */
    public function cancel(Request $request)
    {
        try {
            $tran_id = $request->input('tran_id');

            Log::info('SSLCOMMERZ cancellation callback received', $request->all());

            // Update payment record
            $payment = Payment::where('ssl_transaction_id', $tran_id)->first();
            if ($payment) {
                $payment->update([
                    'ssl_status' => 'CANCELLED',
                ]);

                // Try to restore user session if available (same as success method)
                $consultation = Consultation::find($payment->consultation_id);
                if ($consultation && $consultation->patient_id) {
                    // Re-authenticate the user to restore session
                    Auth::loginUsingId($consultation->patient_id);

                    Log::info('Session restored after payment cancellation', [
                        'user_id' => $consultation->patient_id,
                        'new_session_id' => session()->getId(),
                        'transaction_id' => $tran_id
                    ]);

                    // Redirect to frontend failure page for cancellation with session restored flag
                    return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                        'tran_id' => $tran_id,
                        'amount' => $request->input('amount'),
                        'status' => 'CANCELLED',
                        'failedreason' => 'Payment was cancelled by user',
                        'consultation_id' => $payment->consultation_id,
                        'restored_session' => 'true'
                    ]));
                }
            }

            // Redirect to frontend failure page for cancellation (without session restoration)
            return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                'tran_id' => $tran_id,
                'amount' => $request->input('amount'),
                'status' => 'CANCELLED',
                'failedreason' => 'Payment was cancelled by user'
            ]));

        } catch (\Exception $e) {
            Log::error('Payment cancellation callback error: ' . $e->getMessage());
            // Redirect to frontend failure page
            return redirect(config('app.frontend_url') . '/payment/fail?' . http_build_query([
                'tran_id' => $request->input('tran_id'),
                'amount' => $request->input('amount'),
                'status' => 'ERROR',
                'failedreason' => 'Payment processing error'
            ]));
        }
    }

    /**
     * Handle SSLCOMMERZ IPN (Instant Payment Notification)
     * POST /api/payments/ipn
     */
    public function ipn(Request $request)
    {
        try {
            Log::info('SSLCOMMERZ IPN received', $request->all());

            $tran_id = $request->input('tran_id');
            $status = $request->input('status');
            $amount = $request->input('amount');

            if ($status === 'VALID') {
                // Validate the transaction (for IPN, use val_id if available, otherwise tran_id)
                $val_id = $request->input('val_id', $tran_id);
                $validation = $this->validateTransaction($val_id, $amount);

                if ($validation['status'] === 'VALID') {
                    // Update payment record
                    $payment = Payment::where('ssl_transaction_id', $tran_id)->first();

                    if ($payment && $payment->ssl_status !== 'VALID') {
                        $payment->update([
                            'ssl_status' => 'VALID',
                            'paid_at' => now(),
                        ]);

                        // Update consultation
                        $consultation = Consultation::find($payment->consultation_id);
                        if ($consultation) {
                            // Generate agora channel if not exists
                            if (!$consultation->agora_channel) {
                                $consultation->agora_channel = 'consultation_' . $consultation->id . '_' . time();
                            }

                            $consultation->update([
                                'payment_status' => 'paid',
                                'status' => 'confirmed',
                                'agora_channel' => $consultation->agora_channel
                            ]);
                        }
                    }
                }
            }

            return response('OK', 200);

        } catch (\Exception $e) {
            Log::error('Payment IPN error: ' . $e->getMessage());
            return response('ERROR', 500);
        }
    }

    /**
     * Validate transaction with SSLCOMMERZ
     */
    private function validateTransaction($val_id, $amount)
    {
        try {
            Log::info('Validating transaction', ['val_id' => $val_id, 'amount' => $amount]);

            $validation_data = [
                'store_id' => config('services.sslcommerz.store_id'),
                'store_passwd' => config('services.sslcommerz.store_password'),
                'val_id' => $val_id,
                'format' => 'json',
            ];

            $validation_endpoint = config('services.sslcommerz.sandbox')
                ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
                : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

            // SSLCOMMERZ validation should be GET request with query parameters
            $response = Http::withOptions([
                'verify' => config('app.env') === 'production', // Only verify SSL in production
            ])->get($validation_endpoint, $validation_data);

            if ($response->successful()) {
                $validation = $response->json();
                Log::info('SSLCOMMERZ validation response', $validation);

                // Check if amounts match
                if ($validation['status'] === 'VALID' && $validation['amount'] == $amount) {
                    Log::info('Transaction validation successful');
                    return $validation;
                } else {
                    Log::warning('Transaction validation failed', [
                        'validation_status' => $validation['status'] ?? 'unknown',
                        'validation_amount' => $validation['amount'] ?? 'unknown',
                        'expected_amount' => $amount
                    ]);
                }
            } else {
                Log::error('SSLCOMMERZ validation request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
            }

            return ['status' => 'INVALID'];

        } catch (\Exception $e) {
            Log::error('Transaction validation error: ' . $e->getMessage());
            return ['status' => 'ERROR'];
        }
    }

    /**
     * Get payment history for a user
     * GET /api/payments/history
     */
    public function history(Request $request)
    {
        try {
            $user = $request->user();

            if ($user->role !== 'patient') {
                return response()->json(['message' => 'Only patients can view payment history'], 403);
            }

            $payments = Payment::whereHas('consultation', function ($query) use ($user) {
                $query->where('patient_id', $user->id);
            })
                ->with(['consultation.doctor'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'status' => $payment->ssl_status,
                        'transaction_id' => $payment->ssl_transaction_id,
                        'paid_at' => $payment->paid_at,
                        'doctor_name' => $payment->consultation->doctor->name,
                        'consultation_date' => $payment->consultation->created_at,
                        'created_at' => $payment->created_at,
                    ];
                });

            return response()->json([
                'payments' => $payments
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching payment history: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to fetch payment history'
            ], 500);
        }
    }
}