<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * SSLCommerz hosted checkout, per the vendor's v4 documentation
 * (developer.sslcommerz.com/doc/v4): session initiation, then the order validation API on
 * every callback. A callback is never trusted on its own, sandbox or live.
 */
class SslCommerz
{
    public function __construct(
        private readonly string $storeId,
        private readonly string $storePassword,
        private readonly bool $sandbox,
    ) {}

    public static function fromConfig(): self
    {
        return new self(
            (string) config('services.sslcommerz.store_id'),
            (string) config('services.sslcommerz.store_password'),
            (bool) config('services.sslcommerz.sandbox'),
        );
    }

    /** Creates the payment row and returns the gateway URL to send the patient to. */
    public function initiate(Consultation $consultation, User $patient): array
    {
        $tranId = 'BONDHON-'.$consultation->id.'-'.strtoupper(bin2hex(random_bytes(6)));

        $payload = [
            'store_id' => $this->storeId,
            'store_passwd' => $this->storePassword,
            'total_amount' => number_format((float) $consultation->fee_amount, 2, '.', ''),
            'currency' => 'BDT',
            'tran_id' => $tranId,
            'success_url' => route('payments.success'),
            'fail_url' => route('payments.fail'),
            'cancel_url' => route('payments.cancel'),
            'ipn_url' => route('payments.ipn'),
            'product_name' => 'Video consultation',
            'product_category' => 'Healthcare',
            'product_profile' => 'non-physical-goods',
            'cus_name' => $patient->name ?: 'Patient',
            'cus_email' => $patient->email ?: $patient->phone.'@bondhon.invalid',
            'cus_add1' => $patient->address ?: 'Dhaka',
            'cus_city' => 'Dhaka',
            'cus_country' => 'Bangladesh',
            'cus_phone' => $patient->phone,
            'shipping_method' => 'NO',
            'value_a' => (string) $consultation->id,
        ];

        $response = Http::asForm()->timeout(15)->post($this->host().'/gwprocess/v4/api.php', $payload);
        $data = $response->json();

        if (! $response->successful() || ($data['status'] ?? '') !== 'SUCCESS' || empty($data['GatewayPageURL'])) {
            Log::warning('SSLCommerz session failed', ['status' => $data['status'] ?? null, 'reason' => $data['failedreason'] ?? null]);
            throw new RuntimeException('The payment gateway is not available right now.');
        }

        Payment::updateOrCreate(
            ['consultation_id' => $consultation->id],
            [
                'amount' => $consultation->fee_amount,
                'ssl_transaction_id' => $tranId,
                'ssl_session_key' => $data['sessionkey'] ?? null,
                'ssl_status' => 'PENDING',
            ],
        );

        return ['payment_url' => $data['GatewayPageURL'], 'transaction_id' => $tranId];
    }

    /**
     * Confirms a payment from a callback or IPN. Looks up our own payment row by tran_id,
     * asks the validator API about val_id, and accepts only when the gateway says
     * VALID or VALIDATED for the same transaction, amount and currency.
     */
    public function confirm(?string $tranId, ?string $valId): ?Consultation
    {
        if (! $tranId || ! $valId) {
            return null;
        }

        $payment = Payment::where('ssl_transaction_id', $tranId)->first();

        if (! $payment) {
            return null;
        }

        if ($payment->ssl_status === 'VALID') {
            return $payment->consultation;
        }

        $response = Http::timeout(15)->get($this->host().'/validator/api/validationserverAPI.php', [
            'val_id' => $valId,
            'store_id' => $this->storeId,
            'store_passwd' => $this->storePassword,
            'format' => 'json',
        ]);
        $v = $response->json() ?? [];

        $statusOk = in_array($v['status'] ?? '', ['VALID', 'VALIDATED'], true);
        $sameTran = ($v['tran_id'] ?? null) === $tranId;
        $sameAmount = abs(((float) ($v['amount'] ?? 0)) - (float) $payment->amount) < 0.01;
        $sameCurrency = ($v['currency'] ?? '') === 'BDT';

        if (! ($response->successful() && $statusOk && $sameTran && $sameAmount && $sameCurrency)) {
            Log::warning('SSLCommerz validation rejected', ['tran_id' => $tranId, 'status' => $v['status'] ?? null]);
            $payment->update(['ssl_status' => 'FAILED']);

            return null;
        }

        return DB::transaction(function () use ($payment, $valId, $v) {
            $payment->update([
                'ssl_status' => 'VALID',
                'ssl_val_id' => $valId,
                'ssl_bank_tran_id' => $v['bank_tran_id'] ?? null,
                'ssl_card_type' => $v['card_type'] ?? null,
                'paid_at' => now(),
            ]);

            $consultation = $payment->consultation;
            $consultation->update([
                'payment_status' => 'paid',
                'agora_channel' => $consultation->agora_channel ?: 'consultation_'.$consultation->id.'_'.bin2hex(random_bytes(4)),
            ]);

            return $consultation;
        });
    }

    public function markFailed(?string $tranId): ?Consultation
    {
        $payment = $tranId ? Payment::where('ssl_transaction_id', $tranId)->first() : null;

        if ($payment && $payment->ssl_status !== 'VALID') {
            $payment->update(['ssl_status' => 'FAILED']);
        }

        return $payment?->consultation;
    }

    private function host(): string
    {
        return $this->sandbox ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com';
    }
}
