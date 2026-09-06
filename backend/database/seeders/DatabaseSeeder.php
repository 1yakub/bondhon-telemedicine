<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Doctor;
use App\Models\Consultation;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
    public function run()
    {
        // Create Admin User
        $admin = User::create([
            'name' => 'Bondhon Admin',
            'phone' => '01700000000',
            'email' => 'admin@bondhon.com',
            // no default: the admin password is a deployment secret; a missing value makes a random one nobody knows
            'password' => Hash::make(env('ADMIN_PASSWORD') ?: bin2hex(random_bytes(16))),
            'role' => 'admin',
        ]);

        // Create Test Doctors
        $doctor1 = User::create([
            'name' => 'Ahmed Rahman',
            'phone' => '01700000001',
            'email' => 'ahmed@bondhon.com',
            'password' => Hash::make(env('DEMO_DOCTOR_PASSWORD', 'doctor123')),
            'role' => 'doctor',
            'gender' => 'male',
        ]);

        Doctor::create([
            'user_id' => $doctor1->id,
            'specialization' => 'General Medicine',
            'qualifications' => 'MBBS, FCPS (Medicine)',
            'experience_years' => 8,
            'fee_per_consultation' => 500.00,
            'is_online' => true,
        ]);

        $doctor2 = User::create([
            'name' => 'Fatima Khatun',
            'phone' => '01700000002',
            'email' => 'fatima@bondhon.com',
            'password' => Hash::make(env('DEMO_DOCTOR_PASSWORD', 'doctor123')),
            'role' => 'doctor',
            'gender' => 'female',
        ]);

        Doctor::create([
            'user_id' => $doctor2->id,
            'specialization' => 'Pediatrics',
            'qualifications' => 'MBBS, DCH, FCPS (Pediatrics)',
            'experience_years' => 12,
            'fee_per_consultation' => 600.00,
            'is_online' => false,
        ]);

        $doctor3 = User::create([
            'name' => 'Mohammad Ali',
            'phone' => '01700000003',
            'email' => 'ali@bondhon.com',
            'password' => Hash::make(env('DEMO_DOCTOR_PASSWORD', 'doctor123')),
            'role' => 'doctor',
            'gender' => 'male',
        ]);

        Doctor::create([
            'user_id' => $doctor3->id,
            'specialization' => 'Cardiology',
            'qualifications' => 'MBBS, MD (Cardiology)',
            'experience_years' => 15,
            'fee_per_consultation' => 800.00,
            'is_online' => true,
        ]);

        // Create a Test Patient  
        User::create([
            'name' => 'Test Patient',
            'phone' => '01700000099',
            'role' => 'patient',
            'gender' => 'male',
            'date_of_birth' => '1990-01-01',
            'address' => 'Dhaka, Bangladesh',
        ]);

        echo "Database seeded: admin, three doctors, one patient, one paid consultation.\n";

        // One paid consultation between the test patient and the first doctor, so the
        // video call page can be opened right after seeding.
        $patient = User::where('phone', '01700000099')->first();
        if ($patient && isset($doctor1)) {
            Consultation::create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor1->id,
                'patient_symptoms' => 'Demo consultation for the video call.',
                'fee_amount' => 500.00,
                'payment_status' => 'paid',
                'agora_channel' => 'consultation_demo',
            ]);
        }
    }
}
