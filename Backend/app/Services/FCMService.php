<?php

namespace App\Services;

use App\Models\FCMToken;
use App\Models\Santri;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Google\Auth\Credentials\ServiceAccountCredentials;

class FCMService
{
    protected $projectId;
    protected $fcmUrl;

    public function __construct()
    {
        $this->projectId = config('services.fcm.project_id', 'simpels-faf58');
        $this->fcmUrl = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";
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
        $successCount = 0;
        
        foreach ($tokens as $token) {
            if ($this->sendToSingleToken($token, $title, $body, $data)) {
                $successCount++;
            }
        }

        Log::info('FCM batch notification completed', [
            'total_tokens' => count($tokens),
            'successful' => $successCount,
            'failed' => count($tokens) - $successCount,
        ]);

        return $successCount > 0;
    }

    protected function sendToSingleToken($token, $title, $body, $data = [])
    {
        try {
            $accessToken = $this->getAccessToken();
            if (!$accessToken) {
                Log::error('FCM: Unable to get access token');
                return false;
            }

            $message = [
                'message' => [
                    'token' => $token,
                    'notification' => [
                        'title' => $title,
                        'body' => $body,
                    ],
                    'data' => $data,
                    'webpush' => [
                        'fcm_options' => [
                            'link' => config('app.url'),
                        ],
                    ],
                    'android' => [
                        'priority' => 'high',
                    ],
                ],
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $accessToken,
                'Content-Type' => 'application/json',
            ])->post($this->fcmUrl, $message);

            if ($response->successful()) {
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

    protected function getAccessToken()
    {
        try {
            $credentialsPath = storage_path('app/firebase-credentials.json');
            
            if (!file_exists($credentialsPath)) {
                Log::error('FCM: firebase-credentials.json not found at ' . $credentialsPath);
                return null;
            }

            $credentials = new ServiceAccountCredentials(
                'https://www.googleapis.com/auth/firebase.messaging',
                json_decode(file_get_contents($credentialsPath), true)
            );

            $token = $credentials->fetchAuthToken();
            return $token['access_token'] ?? null;
        } catch (\Exception $e) {
            Log::error('FCM: Error getting access token: ' . $e->getMessage());
            return null;
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
