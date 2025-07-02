<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Doctor;
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
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // Create Test Doctors
        $doctor1 = User::create([
            'name' => 'Dr. Ahmed Rahman',
            'phone' => '01700000001',
            'email' => 'ahmed@bondhon.com',
            'password' => Hash::make('doctor123'),
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
            'name' => 'Dr. Fatima Khatun',
            'phone' => '01700000002',
            'email' => 'fatima@bondhon.com',
            'password' => Hash::make('doctor123'),
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
            'name' => 'Dr. Mohammad Ali',
            'phone' => '01700000003',
            'email' => 'ali@bondhon.com',
            'password' => Hash::make('doctor123'),
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

        echo "✅ Database seeded successfully!\n";
        echo "👤 Admin: admin@bondhon.com / admin123\n";
        echo "👨‍⚕️ Doctors: ahmed@bondhon.com, fatima@bondhon.com, ali@bondhon.com / doctor123\n";
        echo "🏥 3 doctors created with different specializations\n";
    }
}
