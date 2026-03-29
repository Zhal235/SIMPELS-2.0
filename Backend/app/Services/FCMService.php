<?php

namespace App\Services;

use App\Models\FCMToken;
use App\Models\Santri;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FCMService
{
    protected $projectId = 'simpels-faf58';
    protected $credentialsPath;

    public function __construct()
    {
        $this->credentialsPath = storage_path('app/firebase-credentials.json');
    }

    protected function getAccessToken(): ?string
    {
        if (!file_exists($this->credentialsPath)) {
            Log::warning('FCM: firebase-credentials.json not found');
            return null;
        }

        try {
            $credentials = json_decode(file_get_contents($this->credentialsPath), true);

            $now = time();
            $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
            $payload = base64_encode(json_encode([
                'iss'   => $credentials['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud'   => 'https://oauth2.googleapis.com/token',
                'iat'   => $now,
                'exp'   => $now + 3600,
            ]));

            $signingInput = $header . '.' . $payload;
            openssl_sign($signingInput, $signature, $credentials['private_key'], 'SHA256');
            $jwt = $signingInput . '.' . base64_encode($signature);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion'  => $jwt,
            ]);

            return $response->json('access_token');
        } catch (\Exception $e) {
            Log::error('FCM: getAccessToken error: ' . $e->getMessage());
            return null;
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
        $accessToken = $this->getAccessToken();
        if (!$accessToken) {
            Log::warning('FCM: No access token, skipping notification');
            return false;
        }

        $url = "https://fcm.googleapis.com/v1/projects/{$this->projectId}/messages:send";
        $successCount = 0;

        foreach ($tokens as $token) {
            try {
                $response = Http::withToken($accessToken)->post($url, [
                    'message' => [
                        'token'        => $token,
                        'notification' => ['title' => $title, 'body' => $body],
                        'data'         => array_map('strval', $data),
                        'android'      => ['priority' => 'high'],
                        'webpush'      => [
                            'notification' => ['icon' => '/icons/Icon-192.png'],
                        ],
                    ],
                ]);

                if ($response->successful()) {
                    $successCount++;
                } else {
                    Log::error('FCM send failed', ['status' => $response->status(), 'body' => $response->body()]);
                }
            } catch (\Exception $e) {
                Log::error('FCM send error: ' . $e->getMessage());
            }
        }

        Log::info('FCM batch notification completed', [
            'total'      => count($tokens),
            'successful' => $successCount,
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
