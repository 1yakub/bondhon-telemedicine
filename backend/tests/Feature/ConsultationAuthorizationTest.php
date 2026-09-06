<?php

namespace Tests\Feature;

use App\Models\Consultation;
use App\Models\Doctor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ConsultationAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private User $patient;
    private User $otherPatient;
    private User $doctor;
    private User $otherDoctor;
    private Consultation $consultation;

    protected function setUp(): void
    {
        parent::setUp();

        $this->patient = User::create(['phone' => '01711111111', 'role' => 'patient', 'name' => 'Pat']);
        $this->otherPatient = User::create(['phone' => '01722222222', 'role' => 'patient', 'name' => 'Other']);
        $this->doctor = $this->makeDoctor('dr1@example.test', '01733333333');
        $this->otherDoctor = $this->makeDoctor('dr2@example.test', '01744444444');

        $this->consultation = Consultation::create([
            'patient_id' => $this->patient->id,
            'doctor_id' => $this->doctor->id,
            'fee_amount' => 500,
            'payment_status' => 'pending',
        ]);
    }

    public function test_guests_get_401_json(): void
    {
        $this->getJson('/api/consultations')->assertStatus(401);
        $this->getJson("/api/consultations/{$this->consultation->id}")->assertStatus(401);
    }

    public function test_another_patient_cannot_see_or_cancel_it(): void
    {
        $this->actingAs($this->otherPatient)
            ->getJson("/api/consultations/{$this->consultation->id}")->assertStatus(403);

        $this->actingAs($this->otherPatient)
            ->deleteJson("/api/consultations/{$this->consultation->id}")->assertStatus(404);

        $this->assertDatabaseHas('consultations', ['id' => $this->consultation->id]);
    }

    public function test_another_doctor_cannot_see_it_or_join_the_call(): void
    {
        $this->actingAs($this->otherDoctor)
            ->getJson("/api/consultations/{$this->consultation->id}")->assertStatus(403);

        $this->actingAs($this->otherDoctor)
            ->postJson("/api/consultations/{$this->consultation->id}/video/token")->assertStatus(404);
    }

    public function test_the_call_needs_payment_first(): void
    {
        $this->actingAs($this->patient)
            ->postJson("/api/consultations/{$this->consultation->id}/video/token")
            ->assertStatus(403)
            ->assertJsonPath('message', 'Payment is required before the video call.');
    }

    public function test_patients_never_see_another_patients_phone(): void
    {
        $this->consultation->update(['payment_status' => 'paid']);

        $this->actingAs($this->patient)
            ->getJson("/api/consultations/{$this->consultation->id}")
            ->assertOk()
            ->assertJsonMissingPath('data.patient.phone')
            ->assertJsonPath('data.status', 'confirmed');

        $this->actingAs($this->doctor)
            ->getJson("/api/consultations/{$this->consultation->id}")
            ->assertOk()
            ->assertJsonPath('data.patient.phone', '01711111111');
    }

    public function test_a_doctor_cannot_book_and_a_patient_cannot_use_doctor_routes(): void
    {
        $this->actingAs($this->doctor)
            ->postJson('/api/consultations', ['doctor_id' => $this->otherDoctor->id])->assertStatus(403);

        $this->actingAs($this->patient)->getJson('/api/doctor/stats')->assertStatus(403);
        $this->actingAs($this->patient)->getJson('/api/admin/stats')->assertStatus(403);
        $this->actingAs($this->doctor)->getJson('/api/admin/analytics')->assertStatus(403);
    }

    public function test_booking_an_offline_doctor_is_refused(): void
    {
        $this->otherDoctor->doctor->update(['is_online' => false]);

        $this->actingAs($this->patient)
            ->postJson('/api/consultations', ['doctor_id' => $this->otherDoctor->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('doctor_id');

        $this->actingAs($this->patient)
            ->postJson('/api/consultations', ['doctor_id' => $this->doctor->id, 'patient_symptoms' => 'Fever'])
            ->assertStatus(201)
            ->assertJsonPath('data.amount', '500.00')
            ->assertJsonPath('data.status', 'pending');
    }

    private function makeDoctor(string $email, string $phone): User
    {
        $user = User::create(['name' => 'Dr '.$email, 'email' => $email, 'phone' => $phone, 'password' => Hash::make('secret-pass'), 'role' => 'doctor']);
        Doctor::create(['user_id' => $user->id, 'specialization' => 'General', 'qualifications' => 'MBBS', 'experience_years' => 5, 'fee_per_consultation' => 500, 'is_online' => true]);

        return $user->load('doctor');
    }
}
