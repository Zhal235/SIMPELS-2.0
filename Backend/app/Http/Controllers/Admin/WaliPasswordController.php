<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PasswordWali;
use App\Models\Kesantrian\Santri;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WaliPasswordController extends Controller
{
    /**
     * Check if wali has account and get info
     */
    public function checkPassword($noHp)
    {
        // Normalize phone number
        $normalizedHp = $this->normalizePhoneNumber($noHp);
        
        // Find santri with this wali phone
        $santriList = Santri::where(function($query) use ($normalizedHp, $noHp) {
            $query->where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ayah', 'LIKE', '%' . $noHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $noHp . '%');
        })
        ->where('status', 'aktif')
        ->get(['id', 'nama_santri']);

        if ($santriList->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor HP tidak terdaftar atau tidak ada santri aktif'
            ], 404);
        }

        // Check if has custom password
        $passwordWali = PasswordWali::where('no_hp', $noHp)->first();

        return response()->json([
            'success' => true,
            'data' => [
                'no_hp' => $noHp,
                'santri_names' => $santriList->pluck('nama_santri')->toArray(),
                'has_custom_password' => $passwordWali !== null,
                'last_updated' => $passwordWali ? $passwordWali->updated_at->format('d M Y H:i') : null,
            ]
        ]);
    }

    /**
     * Reset wali password to default (123456)
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'no_hp' => 'required|string',
        ]);

        $noHp = $request->no_hp;
        $normalizedHp = $this->normalizePhoneNumber($noHp);
        
        // Verify wali exists
        $santri = Santri::where(function($query) use ($normalizedHp, $noHp) {
            $query->where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ayah', 'LIKE', '%' . $noHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $noHp . '%');
        })
        ->where('status', 'aktif')
        ->first();

        if (!$santri) {
            return response()->json([
                'success' => false,
                'message' => 'Nomor HP tidak terdaftar'
            ], 404);
        }

        // Delete custom password (reset to default)
        $deleted = PasswordWali::where('no_hp', $noHp)->delete();

        return response()->json([
            'success' => true,
            'message' => $deleted > 0 
                ? 'Password berhasil direset ke default (123456)'
                : 'Password sudah menggunakan default (123456)',
        ]);
    }

    /**
     * Normalize phone number for comparison
     */
    private function normalizePhoneNumber($phone)
    {
        // Remove all non-digit characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        // If starts with 0, replace with 62
        if (substr($phone, 0, 1) === '0') {
            $phone = '62' . substr($phone, 1);
        }
        
        // If doesn't start with 62, add it
        if (substr($phone, 0, 2) !== '62') {
            $phone = '62' . $phone;
        }
        
        return $phone;
    }
}
