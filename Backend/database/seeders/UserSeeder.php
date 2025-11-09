<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * UserSeeder
 * -----------------------------
 * Catatan Perubahan (Komentar Teknis):
 * - Seeder ini membuat user admin (diambil dari ENV jika tersedia) dan
 *   sejumlah user demo menggunakan UserFactory.
 * - Tidak mengubah logika bisnis, route, atau alur aplikasi. Hanya data awal.
 * - Password akan di-hash otomatis oleh Eloquent cast (lihat App\Models\User).
 * - Konfigurasi jumlah user demo melalui ENV SEEDER_USER_COUNT (default 10).
 * - Konfigurasi admin melalui ENV ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD.
 */
class UserSeeder extends Seeder
{
    /**
     * Jalankan proses seeding untuk tabel users.
     */
    public function run(): void
    {
        // Buat / perbarui Admin dari ENV (fallback nilai demo)
        $adminName = env('ADMIN_NAME', 'Administrator');
        $adminEmail = env('ADMIN_EMAIL', 'admin@example.com');
        $adminPassword = env('ADMIN_PASSWORD', 'password');

        // Update or Create admin agar idempotent
        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name' => $adminName,
                'password' => $adminPassword, // di-hash oleh cast 'password' => 'hashed'
                'email_verified_at' => now(),
            ]
        );

        // Buat user demo tambahan via factory
        $count = (int) env('SEEDER_USER_COUNT', 10);
        if ($count > 0) {
            User::factory($count)->create();
        }
    }
}