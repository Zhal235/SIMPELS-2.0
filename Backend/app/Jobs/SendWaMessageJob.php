<?php

namespace App\Jobs;

use App\Models\WaMessageLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendWaMessageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 30;
    public int $backoff = 60;

    public function __construct(public readonly WaMessageLog $log) {}

    public function handle(): void
    {
        $gatewayUrl = rtrim(config('services.wa_gateway.url', 'http://wa-gateway:3100'), '/');
        $secret = config('services.wa_gateway.secret', '');

        $response = Http::withHeaders(['X-WA-Secret' => $secret])
            ->timeout(15)
            ->post("{$gatewayUrl}/send", [
                'log_id' => $this->log->id,
                'to'     => $this->log->phone,
                'message' => $this->log->message_body,
            ]);

        if (!$response->successful()) {
            $reason = $response->json('message') ?? 'HTTP ' . $response->status();
            Log::warning("[WA Job] Gateway rejected log #{$this->log->id}: {$reason}");
            $this->log->markFailed($reason);
            $this->fail($reason);
        }
    }

    public function failed(\Throwable $e): void
    {
        $this->log->markFailed($e->getMessage());
    }
}
