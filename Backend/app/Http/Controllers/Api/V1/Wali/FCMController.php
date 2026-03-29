<?php

namespace App\Http\Controllers\Api\V1\Wali;

use App\Http\Controllers\Api\BaseController;
use App\Models\FCMToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FCMController extends BaseController
{
    public function register(Request $request)
    {
        $request->validate([
            'fcm_token' => 'required|string',
            'santri_id' => 'nullable|string',
        ]);

        $santriId = $this->resolveSantriId($request);
        if (!$santriId) {
            return $this->sendError('santri_id tidak valid atau tidak ditemukan', [], 422);
        }

        try {
            FCMToken::updateOrCreate(
                [
                    'santri_id' => $santriId,
                    'fcm_token' => $request->fcm_token,
                ],
                [
                    'device_type' => $request->header('User-Agent', 'unknown'),
                    'last_used_at' => now(),
                ]
            );

            return $this->sendResponse([
                'santri_id' => $santriId,
            ], 'FCM token registered successfully');
        } catch (\Exception $e) {
            Log::error('FCM Token Registration Error: ' . $e->getMessage());
            return $this->sendError('Failed to register FCM token', [], 500);
        }
    }

    public function unregister(Request $request)
    {
        $request->validate([
            'fcm_token' => 'required|string',
            'santri_id' => 'nullable|string',
        ]);

        $santriId = $this->resolveSantriId($request);
        if (!$santriId) {
            return $this->sendError('santri_id tidak valid atau tidak ditemukan', [], 422);
        }

        try {
            FCMToken::where('santri_id', $santriId)
                ->where('fcm_token', $request->fcm_token)
                ->delete();

            return $this->sendResponse([], 'FCM token unregistered successfully');
        } catch (\Exception $e) {
            Log::error('FCM Token Unregistration Error: ' . $e->getMessage());
            return $this->sendError('Failed to unregister FCM token', [], 500);
        }
    }

    private function resolveSantriId(Request $request): ?string
    {
        // 1) Prefer santri_id from payload if valid
        $payloadSantriId = $request->input('santri_id');
        if ($payloadSantriId && DB::table('santri')->where('id', $payloadSantriId)->exists()) {
            return $payloadSantriId;
        }

        // 2) Fallback from Sanctum token abilities: {"santri_ids":["..."]}
        try {
            $token = $request->user()?->currentAccessToken();
            $abilities = $token?->abilities ?? [];

            if (is_string($abilities)) {
                $decoded = json_decode($abilities, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $abilities = $decoded;
                }
            }

            if (is_array($abilities) && isset($abilities['santri_ids']) && is_array($abilities['santri_ids'])) {
                foreach ($abilities['santri_ids'] as $sid) {
                    if (DB::table('santri')->where('id', $sid)->exists()) {
                        return (string) $sid;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('FCM resolveSantriId fallback failed: ' . $e->getMessage());
        }

        return null;
    }
}
