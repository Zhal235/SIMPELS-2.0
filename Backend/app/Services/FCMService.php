<?php

namespace App\Services;

use App\Models\FCMToken;
use App\Models\Santri;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FCMService
{
    protected $serverKey;
    protected $fcmUrl = 'https://fcm.googleapis.com/fcm/send';

    public function __construct()
    {
        $this->serverKey = config('services.fcm.server_key');
    }

    public function sendToSantri($santriId, $title, $body, $data = [])
    {
        $tokens = FCMToken::where('santri_id', $santriId)->pluck('fcm_token')->toArray();

        if (empty($tokens)) {
            Log::info("No FCM tokens found for santri ID: {$santriId}");
            return false;
        }

        return $this->sendNotification($tokens, $title, $body, $data);
    }

    public function sendToMultipleSantri(array $santriIds, $title, $body, $data = [])
    {
        $tokens = FCMToken::whereIn('santri_id', $santriIds)->pluck('fcm_token')->toArray();

        if (empty($tokens)) {
            Log::info("No FCM tokens found for santri IDs: " . implode(', ', $santriIds));
            return false;
        }

        return $this->sendNotification($tokens, $title, $body, $data);
    }

    protected function sendNotification(array $tokens, $title, $body, $data = [])
    {
        if (empty($this->serverKey)) {
            Log::error('FCM Server Key not configured');
            return false;
        }

        $payload = [
            'registration_ids' => $tokens,
            'notification' => [
                'title' => $title,
                'body' => $body,
                'sound' => 'default',
                'badge' => '1',
            ],
            'data' => array_merge($data, [
                'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            ]),
            'priority' => 'high',
        ];

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $this->serverKey,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $payload);

            if ($response->successful()) {
                Log::info('FCM notification sent successfully', [
                    'title' => $title,
                    'tokens_count' => count($tokens),
                ]);
                return true;
            } else {
                Log::error('FCM notification failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('FCM notification error: ' . $e->getMessage());
            return false;
        }
    }

    public function sendPaymentApproved($santriId, $paymentAmount, $paymentId)
    {
        $santri = Santri::find($santriId);
        $title = 'Pembayaran Disetujui';
        $body = "Pembayaran Rp " . number_format($paymentAmount, 0, ',', '.') . " telah disetujui";

        return $this->sendToSantri($santriId, $title, $body, [
            'type' => 'payment_approved',
            'payment_id' => $paymentId,
            'santri_id' => $santriId,
            'santri_name' => $santri?->nama ?? 'Santri',
        ]);
    }

    public function sendPaymentRejected($santriId, $paymentAmount, $paymentId, $reason = '')
    {
        $santri = Santri::find($santriId);
        $title = 'Pembayaran Ditolak';
        $body = "Pembayaran Rp " . number_format($paymentAmount, 0, ',', '.') . " ditolak";
        if ($reason) {
            $body .= ". Alasan: {$reason}";
        }

        return $this->sendToSantri($santriId, $title, $body, [
            'type' => 'payment_rejected',
            'payment_id' => $paymentId,
            'santri_id' => $santriId,
            'santri_name' => $santri?->nama ?? 'Santri',
            'reason' => $reason,
        ]);
    }

    public function sendTopupApproved($santriId, $topupAmount, $topupId)
    {
        $santri = Santri::find($santriId);
        $title = 'Top-up Disetujui';
        $body = "Top-up Rp " . number_format($topupAmount, 0, ',', '.') . " telah disetujui";

        return $this->sendToSantri($santriId, $title, $body, [
            'type' => 'topup_approved',
            'topup_id' => $topupId,
            'santri_id' => $santriId,
            'santri_name' => $santri?->nama ?? 'Santri',
        ]);
    }

    public function sendNewTagihan($santriId, $tagihanName, $tagihanAmount)
    {
        $santri = Santri::find($santriId);
        $title = 'Tagihan Baru';
        $body = "Tagihan {$tagihanName}: Rp " . number_format($tagihanAmount, 0, ',', '.');

        return $this->sendToSantri($santriId, $title, $body, [
            'type' => 'new_tagihan',
            'santri_id' => $santriId,
            'santri_name' => $santri?->nama ?? 'Santri',
        ]);
    }

    public function sendTagihanReminder($santriId, $tagihanName, $dueDate)
    {
        $santri = Santri::find($santriId);
        $title = 'Pengingat Tagihan';
        $body = "Tagihan {$tagihanName} akan jatuh tempo pada {$dueDate}";

        return $this->sendToSantri($santriId, $title, $body, [
            'type' => 'tagihan_reminder',
            'santri_id' => $santriId,
            'santri_name' => $santri?->nama ?? 'Santri',
        ]);
    }

    public function sendAnnouncement($santriIds, $title, $message)
    {
        return $this->sendToMultipleSantri($santriIds, $title, $message, [
            'type' => 'announcement',
        ]);
    }
}
