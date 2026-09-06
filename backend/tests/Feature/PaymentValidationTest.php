<?php

namespace Tests\Feature;

use App\Models\Consultation;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PaymentValidationTest extends TestCase
{
    use RefreshDatabase;

    private Consultation $consultation;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.sslcommerz.store_id' => 'teststore',
            'services.sslcommerz.store_password' => 'testpass',
            'services.sslcommerz.sandbox' => true,
            'app.frontend_url' => 'https://web.test',
        ]);

        $patient = User::create(['phone' => '01711111111', 'role' => 'patient', 'name' => 'Pat']);
        $doctor = User::create(['phone' => '01733333333', 'role' => 'doctor', 'name' => 'Dr', 'email' => 'dr@example.test', 'password' => 'x']);

        $this->consultation = Consultation::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'fee_amount' => 500,
            'payment_status' => 'pending',
        ]);

        Payment::create([
            'consultation_id' => $this->consultation->id,
            'amount' => 500,
            'ssl_transaction_id' => 'BONDHON-TEST-1',
            'ssl_status' => 'PENDING',
        ]);
    }

    public function test_a_forged_success_callback_does_not_mark_anything_paid(): void
    {
        Http::fake(['*/validator/api/validationserverAPI.php*' => Http::response(['status' => 'INVALID_TRANSACTION'], 200)]);

        $this->post('/api/payments/success', ['tran_id' => 'BONDHON-TEST-1', 'val_id' => 'fake', 'status' => 'VALID', 'amount' => '500.00'])
            ->assertRedirect('https://web.test/visits/'.$this->consultation->id.'?payment=failed');

        $this->assertDatabaseHas('consultations', ['id' => $this->consultation->id, 'payment_status' => 'pending']);
        $this->assertDatabaseHas('payments', ['ssl_transaction_id' => 'BONDHON-TEST-1', 'ssl_status' => 'FAILED']);
        $this->assertGuest();
    }

    public function test_a_validated_callback_with_a_different_amount_is_rejected(): void
    {
        Http::fake(['*/validator/api/validationserverAPI.php*' => Http::response([
            'status' => 'VALID', 'tran_id' => 'BONDHON-TEST-1', 'amount' => '5.00', 'currency' => 'BDT',
        ])]);

        $this->post('/api/payments/ipn', ['tran_id' => 'BONDHON-TEST-1', 'val_id' => 'v1', 'status' => 'VALID'])->assertOk();

        $this->assertDatabaseHas('consultations', ['id' => $this->consultation->id, 'payment_status' => 'pending']);
    }

    public function test_a_validated_callback_marks_the_consultation_paid_once(): void
    {
        Http::fake(['*/validator/api/validationserverAPI.php*' => Http::response([
            'status' => 'VALIDATED', 'tran_id' => 'BONDHON-TEST-1', 'amount' => '500.00', 'currency' => 'BDT',
            'bank_tran_id' => 'BANK1', 'card_type' => 'VISA-Dutch Bangla',
        ])]);

        $this->post('/api/payments/success', ['tran_id' => 'BONDHON-TEST-1', 'val_id' => 'v1', 'status' => 'VALID'])
            ->assertRedirect('https://web.test/visits/'.$this->consultation->id.'?payment=paid');

        $this->assertDatabaseHas('consultations', ['id' => $this->consultation->id, 'payment_status' => 'paid']);
        $this->assertDatabaseHas('payments', ['ssl_transaction_id' => 'BONDHON-TEST-1', 'ssl_status' => 'VALID', 'ssl_val_id' => 'v1']);
        $this->assertNotNull($this->consultation->fresh()->agora_channel);

        // the callback never signs the browser in as the patient
        $this->assertGuest();

        // a replayed IPN does not call the validator again
        Http::fake();
        $this->post('/api/payments/ipn', ['tran_id' => 'BONDHON-TEST-1', 'val_id' => 'v1'])->assertOk();
        Http::assertNothingSent();
    }

    public function test_unknown_transactions_are_ignored(): void
    {
        Http::fake();

        $this->post('/api/payments/success', ['tran_id' => 'NOPE', 'val_id' => 'v1'])
            ->assertRedirect('https://web.test/visits?payment=failed');

        Http::assertNothingSent();
    }

    public function test_only_the_owning_patient_can_start_checkout(): void
    {
        Http::fake(['*/gwprocess/v4/api.php' => Http::response(['status' => 'SUCCESS', 'GatewayPageURL' => 'https://sandbox.sslcommerz.com/pay/abc', 'sessionkey' => 'sk'])]);

        $other = User::create(['phone' => '01722222222', 'role' => 'patient', 'name' => 'Other']);

        $this->actingAs($other)
            ->postJson("/api/consultations/{$this->consultation->id}/pay")->assertStatus(404);

        $this->actingAs($this->consultation->patient)
            ->postJson("/api/consultations/{$this->consultation->id}/pay")
            ->assertOk()
            ->assertJsonPath('payment_url', 'https://sandbox.sslcommerz.com/pay/abc');

        Http::assertSent(fn ($request) => $request['store_id'] === 'teststore' && $request['total_amount'] === '500.00' && $request['currency'] === 'BDT');
    }
}
