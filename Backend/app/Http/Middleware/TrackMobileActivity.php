<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\MobileActivityLog;

class TrackMobileActivity
{
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $response = $next($request);
        $responseTime = (microtime(true) - $startTime) * 1000;
        
        $userAgent = $request->header('User-Agent', '');
        $isMobileApp = $this->isMobileApp($userAgent, $request);
        
        if ($isMobileApp) {
            try {
                $noHp = $this->extractNoHp($request);
                $santriId = $request->input('santri_id') ?? $request->route('santri_id') ?? null;
                $endpoint = $request->path();
                $action = $this->determineAction($endpoint, $request->method());
                $feature = $this->determineFeature($endpoint);
                
                MobileActivityLog::create([
                    'no_hp' => $noHp,
                    'santri_id' => $santriId,
                    'action' => $action,
                    'feature' => $feature,
                    'endpoint' => $endpoint,
                    'method' => $request->method(),
                    'device' => $this->detectDevice($userAgent),
                    'device_model' => $request->header('X-Device-Model'),
                    'app_version' => $request->header('X-App-Version'),
                    'ip_address' => $request->ip(),
                    'user_agent' => $userAgent,
                    'response_time' => round($responseTime),
                    'status_code' => $response->getStatusCode(),
                ]);
            } catch (\Exception $e) {
                \Log::error('Mobile activity log failed: ' . $e->getMessage());
            }
        }
        
        return $response;
    }

    private function isMobileApp(string $userAgent, Request $request): bool
    {
        return $request->header('X-Mobile-App') === 'SIMPELS-Mobile' || 
               str_starts_with($request->path(), 'api/v1/wali/');
    }

    private function extractNoHp(Request $request): ?string
    {
        if ($request->has('no_hp')) return $request->input('no_hp');
        
        $user = $request->user();
        if ($user && $user->currentAccessToken()) {
            $tokenName = $user->currentAccessToken()->name;
            if (preg_match('/wali-mobile-(.+)/', $tokenName, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    private function determineAction(string $endpoint, string $method): string
    {
        if (str_contains($endpoint, '/login')) return 'login';
        if (str_contains($endpoint, '/santri') && !str_contains($endpoint, '/saldo')) return 'view_santri';
        if (str_contains($endpoint, '/saldo')) return 'view_saldo';
        if (str_contains($endpoint, '/tagihan')) return 'view_tagihan';
        if (str_contains($endpoint, '/histori-pembayaran')) return 'view_history';
        if (str_contains($endpoint, '/tabungan')) return 'view_tabungan';
        if (str_contains($endpoint, '/bukti-transfer')) return 'upload_bukti';
        if (str_contains($endpoint, '/change-password')) return 'change_password';
        return $method . '_' . basename($endpoint);
    }

    private function determineFeature(string $endpoint): string
    {
        if (str_contains($endpoint, '/login') || str_contains($endpoint, '/change-password')) return 'auth';
        if (str_contains($endpoint, '/santri')) return 'dashboard';
        if (str_contains($endpoint, '/saldo') || str_contains($endpoint, '/wallet')) return 'dompet';
        if (str_contains($endpoint, '/tagihan') || str_contains($endpoint, '/pembayaran')) return 'pembayaran';
        if (str_contains($endpoint, '/tabungan')) return 'tabungan';
        if (str_contains($endpoint, '/bukti-transfer')) return 'bukti_transfer';
        return 'app';
    }

    private function detectDevice(string $userAgent): string
    {
        $ua = strtolower($userAgent);
        if (str_contains($ua, 'android')) return 'Android';
        if (str_contains($ua, 'iphone') || str_contains($ua, 'ipad')) return 'iOS';
        return 'Unknown';
    }
}
