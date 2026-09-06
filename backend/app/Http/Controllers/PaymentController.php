<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\Payment;
use App\Services\SslCommerz;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use RuntimeException;

/**
 * Patient checkout through SSLCommerz. Authorization is the ConsultationPolicy
 * (`can:pay`) on the route. Every callback goes through the validator API before
 * anything is marked paid; the browser is then sent back to the visit page, where
 * the patient's own session shows the result. No callback ever signs anyone in.
 */
class PaymentController extends Controller
{
    public function __construct(private readonly SslCommerz $gateway) {}

    public function initiate(Request $request, Consultation $consultation): JsonResponse
    {
        try {
            $session = $this->gateway->initiate($consultation, $request->user());
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json($session);
    }

    public function success(Request $request): RedirectResponse
    {
        $consultation = $this->gateway->confirm($request->input('tran_id'), $request->input('val_id'));

        if ($consultation) {
            return $this->backToVisit($consultation, 'paid');
        }

        $failed = $this->gateway->markFailed($request->input('tran_id'));

        return $this->backToVisit($failed, 'failed');
    }

    public function fail(Request $request): RedirectResponse
    {
        return $this->backToVisit($this->gateway->markFailed($request->input('tran_id')), 'failed');
    }

    public function cancel(Request $request): RedirectResponse
    {
        return $this->backToVisit($this->gateway->markFailed($request->input('tran_id')), 'cancelled');
    }

    /** Instant Payment Notification: same validation path, plain text answer for the gateway. */
    public function ipn(Request $request): Response
    {
        $this->gateway->confirm($request->input('tran_id'), $request->input('val_id'));

        return response('OK');
    }

    public function history(Request $request): JsonResponse
    {
        $payments = Payment::query()
            ->whereHas('consultation', fn ($q) => $q->where('patient_id', $request->user()->id))
            ->with('consultation.doctor')
            ->latest()
            ->get()
            ->map(fn (Payment $p) => [
                'id' => $p->id,
                'consultation_id' => $p->consultation_id,
                'amount' => (string) $p->amount,
                'status' => $p->ssl_status,
                'transaction_id' => $p->ssl_transaction_id,
                'paid_at' => $p->paid_at,
                'doctor_name' => $p->consultation?->doctor?->name,
                'created_at' => $p->created_at,
            ]);

        return response()->json(['payments' => $payments]);
    }

    private function backToVisit(?Consultation $consultation, string $result): RedirectResponse
    {
        $base = rtrim(config('app.frontend_url'), '/');
        $path = $consultation ? '/visits/'.$consultation->id : '/visits';

        return redirect()->away($base.$path.'?payment='.$result);
    }
}
