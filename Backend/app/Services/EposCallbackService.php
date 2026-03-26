<?php

namespace App\Services;

use App\Models\EposKebutuhanOrder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EposCallbackService
{
    private string $baseUrl;
    private string $secret;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('EPOS_CALLBACK_URL', ''), '/');
        $this->secret  = env('EPOS_WEBHOOK_SECRET', '');
    }

    /**
     * Push perubahan status pesanan kebutuhan ke EPOS.
     * Dipanggil setelah confirm atau reject berhasil disimpan ke DB.
     * Fire-and-forget: error tidak roll-back proses di SIMPELS.
     */
    public function pushOrderStatus(EposKebutuhanOrder $order): void
    {
        if (empty($this->baseUrl)) {
            Log::warning('EposCallbackService: EPOS_CALLBACK_URL tidak dikonfigurasi');
            return;
        }

        $url = "{$this->baseUrl}/{$order->epos_order_id}/status";

        $payload = [
            'status'           => $order->status,
            'confirmed_by'     => $order->confirmed_by,
            'confirmed_at'     => $order->confirmed_at?->toIso8601String(),
            'rejection_reason' => $order->rejection_reason,
        ];

        try {
            $response = Http::timeout(5)
                ->withHeaders(['X-Epos-Secret' => $this->secret])
                ->post($url, $payload);

            if ($response->successful()) {
                Log::info('EposCallback: status pushed', [
                    'order'  => $order->epos_order_id,
                    'status' => $order->status,
                ]);
            } else {
                Log::warning('EposCallback: push gagal', [
                    'order'  => $order->epos_order_id,
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            // Jangan sampai error ini membatalkan proses konfirmasi di SIMPELS
            Log::error('EposCallback: exception saat push', [
                'order' => $order->epos_order_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
