<?php

namespace Tests\Feature;

use App\Models\Consultation;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_analytics_work_on_any_database_driver(): void
    {
        $admin = User::create(['phone' => '01700000000', 'role' => 'admin', 'name' => 'Desk', 'email' => 'desk@example.test', 'password' => 'x']);
        $patient = User::create(['phone' => '01711111111', 'role' => 'patient', 'name' => 'Pat']);
        $doctor = User::create(['phone' => '01733333333', 'role' => 'doctor', 'name' => 'Dr Rahim', 'email' => 'dr@example.test', 'password' => 'x']);

        $c = Consultation::create(['patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'fee_amount' => 500, 'payment_status' => 'paid']);
        Payment::create(['consultation_id' => $c->id, 'amount' => 500, 'ssl_transaction_id' => 'T1', 'ssl_status' => 'VALID', 'paid_at' => now()]);
        Consultation::create(['patient_id' => $patient->id, 'doctor_id' => $doctor->id, 'fee_amount' => 500, 'payment_status' => 'pending']);

        $this->actingAs($admin)
            ->getJson('/api/admin/analytics')
            ->assertOk()
            ->assertJsonPath('analytics.consultations_by_status.paid', 1)
            ->assertJsonPath('analytics.consultations_by_status.pending', 1)
            ->assertJsonPath('analytics.revenue_by_month.0.month', now()->format('Y-m'))
            ->assertJsonPath('analytics.revenue_by_month.0.total', '500.00')
            ->assertJsonPath('analytics.top_doctors.0.doctor_name', 'Dr Rahim')
            ->assertJsonPath('analytics.top_doctors.0.consultation_count', 2);
    }
}
