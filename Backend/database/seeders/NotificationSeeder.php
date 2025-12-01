<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Notification;
use App\Models\Santri;

class NotificationSeeder extends Seeder
{
    public function run(): void
    {
        // Get first santri for demo
        $santri = Santri::first();
        
        if (!$santri) {
            $this->command->warn('No santri found. Skipping notification seeder.');
            return;
        }

        $this->command->info("Creating demo notifications for santri: {$santri->nama_lengkap}");

        // Sample notifications
        $notifications = [
            [
                'user_id' => $santri->id,
                'user_type' => 'wali',
                'type' => 'payment_approved',
                'title' => 'Pembayaran Disetujui ✅',
                'message' => 'Pembayaran BMP September 2025 sebesar Rp 550.000 telah disetujui.',
                'data' => ['nominal' => 550000],
                'is_read' => false,
                'created_at' => now()->subMinutes(5),
            ],
            [
                'user_id' => $santri->id,
                'user_type' => 'wali',
                'type' => 'topup_approved',
                'title' => 'Top-up Disetujui ✅',
                'message' => 'Top-up dompet sebesar Rp 100.000 telah disetujui dan masuk ke dompet santri.',
                'data' => ['nominal' => 100000],
                'is_read' => false,
                'created_at' => now()->subHours(2),
            ],
            [
                'user_id' => $santri->id,
                'user_type' => 'wali',
                'type' => 'new_tagihan',
                'title' => 'Tagihan Baru 📋',
                'message' => 'Tagihan BMP bulan Oktober 2025 sebesar Rp 550.000 telah ditambahkan.',
                'data' => ['nominal' => 550000],
                'is_read' => true,
                'read_at' => now()->subHours(1),
                'created_at' => now()->subDays(1),
            ],
            [
                'user_id' => $santri->id,
                'user_type' => 'wali',
                'type' => 'tagihan_reminder',
                'title' => 'Reminder Tagihan ⏰',
                'message' => 'Tagihan BMP bulan November 2025 sebesar Rp 550.000 akan jatuh tempo pada 10 November 2025.',
                'data' => ['nominal' => 550000, 'due_date' => '2025-11-10'],
                'is_read' => true,
                'read_at' => now()->subDays(2),
                'created_at' => now()->subDays(3),
            ],
        ];

        foreach ($notifications as $notif) {
            Notification::create($notif);
        }

        $this->command->info('Demo notifications created successfully!');
    }
}
