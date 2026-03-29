<?php

namespace App\Services;

use App\Models\FCMToken;
use App\Models\Santri;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FCMService
{
    protected $messaging;

    public function __construct()
    {
        $credentialsPath = storage_path('app/firebase-credentials.json');
        
        if (file_exists($credentialsPath)) {
            $factory = (new Factory)->withServiceAccount($credentialsPath);
            $this->messaging = $factory->createMessaging();
        } else {
            Log::warning('FCM: firebase-credentials.json not found, notifications disabled');
            $this->messaging = null;
        }
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
        if (!$this->messaging) {
            Log::warning('FCM: Messaging not initialized, skipping notification');
            return false;
        }

        $successCount = 0;
        
        foreach ($tokens as $token) {
            try {
                $notification = Notification::create($title, $body);
                
                $message = CloudMessage::withTarget('token', $token)
                    ->withNotification($notification)
                    ->withData($data);

                $this->messaging->send($message);
                $successCount++;
            } catch (\Exception $e) {
                Log::error('FCM send failed for token', [
                    'error' => $e->getMessage(),
                    'token' => substr($token, 0, 20) . '...',
                ]);
            }
        }

        Log::info('FCM batch notification completed', [
            'total_tokens' => count($tokens),
            'successful' => $successCount,
            'failed' => count($tokens) - $successCount,
        ]);

        return $successCount > 0;
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
