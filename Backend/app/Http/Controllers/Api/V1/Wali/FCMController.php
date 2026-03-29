<?php

namespace App\Http\Controllers\Api\V1\Wali;

use App\Http\Controllers\Api\BaseController;
use App\Models\FCMToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FCMController extends BaseController
{
    public function register(Request $request)
    {
        $request->validate([
            'santri_id' => 'required|exists:santri,id',
            'fcm_token' => 'required|string',
        ]);

        try {
            FCMToken::updateOrCreate(
                [
                    'santri_id' => $request->santri_id,
                    'fcm_token' => $request->fcm_token,
                ],
                [
                    'device_type' => $request->header('User-Agent', 'unknown'),
                    'last_used_at' => now(),
                ]
            );

            return $this->sendResponse([], 'FCM token registered successfully');
        } catch (\Exception $e) {
            Log::error('FCM Token Registration Error: ' . $e->getMessage());
            return $this->sendError('Failed to register FCM token', [], 500);
        }
    }

    public function unregister(Request $request)
    {
        $request->validate([
            'santri_id' => 'required|exists:santri,id',
            'fcm_token' => 'required|string',
        ]);

        try {
            FCMToken::where('santri_id', $request->santri_id)
                ->where('fcm_token', $request->fcm_token)
                ->delete();

            return $this->sendResponse([], 'FCM token unregistered successfully');
        } catch (\Exception $e) {
            Log::error('FCM Token Unregistration Error: ' . $e->getMessage());
            return $this->sendError('Failed to unregister FCM token', [], 500);
        }
    }
}
