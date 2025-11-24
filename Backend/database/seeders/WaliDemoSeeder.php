<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class WaliDemoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a demo wali user for mobile app testing
        User::updateOrCreate(
            ['email' => 'wali@simpels.com'],
            [
                'name' => 'Wali Santri Demo',
                'password' => 'password', // Will be hashed automatically
                'email_verified_at' => now(),
                'role' => 'wali',
            ]
        );
    }
}
