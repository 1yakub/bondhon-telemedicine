<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthThrottleTest extends TestCase
{
    use RefreshDatabase;

    public function test_otp_send_is_limited_per_phone(): void
    {
        $this->postJson('/api/auth/send-otp', ['phone' => '01712345678'])->assertOk();
        $this->postJson('/api/auth/send-otp', ['phone' => '01712345678'])->assertOk();
        $this->postJson('/api/auth/send-otp', ['phone' => '01712345678'])->assertStatus(429);
    }

    public function test_otp_verify_locks_after_five_wrong_guesses(): void
    {
        $this->postJson('/api/auth/send-otp', ['phone' => '01812345678'])->assertOk();

        foreach (range(1, 5) as $i) {
            $this->postJson('/api/auth/verify-otp', ['phone' => '01812345678', 'otp' => '000000'])
                ->assertStatus(422);
        }

        $this->postJson('/api/auth/verify-otp', ['phone' => '01812345678', 'otp' => '000000'])
            ->assertStatus(429);
    }

    public function test_demo_code_signs_a_patient_in_and_regenerates_the_session(): void
    {
        config(['app.demo' => true]);

        $code = $this->postJson('/api/auth/send-otp', ['phone' => '01912345678'])->json('demo_code');
        $this->assertNotNull($code);

        $this->postJson('/api/auth/verify-otp', ['phone' => '01912345678', 'otp' => $code])
            ->assertOk()
            ->assertJsonPath('user.role', 'patient');

        $this->assertAuthenticated();

        // the code is single use
        $this->post('/api/auth/logout');
        $this->postJson('/api/auth/verify-otp', ['phone' => '01912345678', 'otp' => $code])->assertStatus(422);
    }

    public function test_password_login_is_limited_per_email(): void
    {
        User::create(['name' => 'Desk', 'email' => 'desk@example.test', 'phone' => '01000000001', 'password' => Hash::make('secret-pass'), 'role' => 'admin']);

        foreach (range(1, 5) as $i) {
            $this->postJson('/api/auth/admin/login', ['email' => 'desk@example.test', 'password' => 'wrong'])->assertStatus(422);
        }

        $this->postJson('/api/auth/admin/login', ['email' => 'desk@example.test', 'password' => 'secret-pass'])->assertStatus(429);
    }

    public function test_a_doctor_cannot_use_the_admin_login(): void
    {
        User::create(['name' => 'Dr', 'email' => 'dr@example.test', 'phone' => '01000000002', 'password' => Hash::make('secret-pass'), 'role' => 'doctor']);

        $this->postJson('/api/auth/admin/login', ['email' => 'dr@example.test', 'password' => 'secret-pass'])->assertStatus(422);
        $this->assertGuest();
    }
}
