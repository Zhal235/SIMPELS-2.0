<?php

namespace App\Services\Wali;

use App\Models\User;
use App\Models\Santri;
use App\Models\PasswordWali;
use App\Models\SantriTransactionLimit;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Wali Authentication Service
 * 
 * Handles login and password management for wali (parent/guardian)
 */
class WaliAuthService
{
    /**
     * Process wali login menggunakan nomor HP
     * 
     * @param array $credentials ['no_hp', 'password']
     * @param string|null $userAgent
     * @return array
     */
    public function login(array $credentials, ?string $userAgent = null): array
    {
        $noHp = $credentials['no_hp'];
        $password = $credentials['password'];
        $normalizedHp = $this->normalizePhoneNumber($noHp);

        // Check if wali has custom password
        $passwordWali = PasswordWali::where('no_hp', $noHp)->first();
        
        if ($passwordWali) {
            // Wali has custom password
            if (!Hash::check($password, $passwordWali->password)) {
                throw ValidationException::withMessages([
                    'password' => ['Password salah.'],
                ]);
            }
            
            // Track mobile login
            $this->trackLogin($passwordWali, $userAgent);
            
        } else {
            // Use default password 123456
            if ($password !== '123456') {
                throw ValidationException::withMessages([
                    'password' => ['Password salah.'],
                ]);
            }
            
            // Create new password_wali entry untuk tracking
            $passwordWali = PasswordWali::create([
                'no_hp' => $noHp,
                'password' => Hash::make('123456'),
                'last_mobile_login_at' => now(),
                'mobile_login_count' => 1,
                'last_mobile_device' => $this->detectDevice($userAgent),
            ]);
        }

        // Cari santri berdasarkan hp_ayah atau hp_ibu
        $santriList = $this->findSantriByPhone($normalizedHp, $noHp);

        if ($santriList->isEmpty()) {
            throw ValidationException::withMessages([
                'no_hp' => ['Nomor HP tidak terdaftar atau tidak ada santri aktif.'],
            ]);
        }

        // Ambil santri pertama untuk data wali
        $firstSantri = $santriList->first();
        
        // Tentukan tipe wali (ayah atau ibu)
        [$tipeWali, $namaWali] = $this->determineWaliType($firstSantri, $normalizedHp, $noHp);

        // Create token
        $token = $this->createAuthToken($noHp, $normalizedHp, $santriList);

        // Format response data
        $santriData = $this->formatSantriData($santriList, $tipeWali, $namaWali);

        return [
            'success' => true,
            'message' => 'Login berhasil',
            'token' => $token,
            'wali' => [
                'no_hp' => $noHp,
                'nama' => $namaWali,
                'tipe' => $tipeWali,
                'label' => ucfirst($tipeWali) . ' dari ' . $firstSantri->nama_santri,
            ],
            'santri' => $santriData,
            'active_santri_id' => $santriList->first()->id,
        ];
    }

    /**
     * Change wali password
     * 
     * @param array $data ['no_hp', 'current_password', 'new_password']
     * @return array
     */
    public function changePassword(array $data): array
    {
        $noHp = $data['no_hp'];
        $currentPassword = $data['current_password'];
        $newPassword = $data['new_password'];
        $normalizedHp = $this->normalizePhoneNumber($noHp);
        
        // Check if wali has santri
        $santri = Santri::where(function($query) use ($normalizedHp, $noHp) {
            $query->where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ayah', 'LIKE', '%' . $noHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $noHp . '%');
        })->where('status', 'aktif')->first();

        if (!$santri) {
            return [
                'success' => false,
                'message' => 'Nomor HP tidak terdaftar',
                'status_code' => 404,
            ];
        }

        // Verify current password
        $passwordWali = PasswordWali::where('no_hp', $noHp)->first();
        
        if ($passwordWali) {
            // User has custom password
            if (!Hash::check($currentPassword, $passwordWali->password)) {
                return [
                    'success' => false,
                    'message' => 'Password lama tidak sesuai',
                    'status_code' => 422,
                ];
            }
        } else {
            // Check default password
            if ($currentPassword !== '123456') {
                return [
                    'success' => false,
                    'message' => 'Password lama tidak sesuai',
                    'status_code' => 422,
                ];
            }
        }

        // Store/update custom password
        PasswordWali::updateOrCreate(
            ['no_hp' => $noHp],
            [
                'password' => Hash::make($newPassword),
                'updated_at' => now(),
            ]
        );

        return [
            'success' => true,
            'message' => 'Password berhasil diubah',
            'status_code' => 200,
        ];
    }

    /**
     * Find santri by phone number
     * 
     * @param string $normalizedHp
     * @param string $originalHp
     * @return \Illuminate\Database\Eloquent\Collection
     */
    private function findSantriByPhone(string $normalizedHp, string $originalHp)
    {
        return Santri::where(function($query) use ($normalizedHp, $originalHp) {
            $query->where('hp_ayah', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ayah', 'LIKE', '%' . $originalHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $normalizedHp . '%')
                  ->orWhere('hp_ibu', 'LIKE', '%' . $originalHp . '%');
        })
        ->with(['kelas', 'asrama', 'wallet'])
        ->where('status', 'aktif')
        ->get();
    }

    /**
     * Determine wali type (ayah or ibu)
     * 
     * @param Santri $santri
     * @param string $normalizedHp
     * @param string $originalHp
     * @return array [type, name]
     */
    private function determineWaliType($santri, string $normalizedHp, string $originalHp): array
    {
        $tipeWali = 'ayah';
        $namaWali = $santri->nama_ayah ?? 'Wali';
        
        if (stripos($santri->hp_ibu ?? '', $normalizedHp) !== false || 
            stripos($santri->hp_ibu ?? '', $originalHp) !== false) {
            $tipeWali = 'ibu';
            $namaWali = $santri->nama_ibu ?? 'Wali';
        }

        return [$tipeWali, $namaWali];
    }

    /**
     * Create authentication token for wali
     * 
     * @param string $noHp
     * @param string $normalizedHp
     * @param \Illuminate\Database\Eloquent\Collection $santriList
     * @return string
     */
    private function createAuthToken(string $noHp, string $normalizedHp, $santriList): string
    {
        $santriIds = $santriList->pluck('id')->toArray();
        
        // Get or create system user for token generation
        $systemUser = User::firstOrCreate(
            ['email' => 'system.wali@simpels.internal'],
            [
                'name' => 'System Wali',
                'password' => Hash::make('system-only'),
                'role' => 'wali'
            ]
        );
        
        return $systemUser->createToken(
            'wali-mobile-' . $normalizedHp,
            ['santri_ids' => $santriIds],
            now()->addYear()
        )->plainTextToken;
    }

    /**
     * Format santri data for response
     * 
     * @param \Illuminate\Database\Eloquent\Collection $santriList
     * @param string $tipeWali
     * @param string $namaWali
     * @return array
     */
    private function formatSantriData($santriList, string $tipeWali, string $namaWali): array
    {
        return $santriList->map(function ($s) use ($tipeWali, $namaWali) {
            $transactionLimit = SantriTransactionLimit::where('santri_id', $s->id)->first();
            
            $fotoUrl = null;
            if ($s->foto) {
                if (str_starts_with($s->foto, 'http://') || str_starts_with($s->foto, 'https://')) {
                    $fotoUrl = $s->foto;
                } else {
                    $fotoUrl = Storage::disk('r2')->url($s->foto);
                }
            }
            
            return [
                'id' => $s->id,
                'nis' => $s->nis,
                'nama' => $s->nama_santri,
                'jenis_kelamin' => $s->jenis_kelamin,
                'kelas' => $s->kelas_nama ?? ($s->kelas->nama_kelas ?? null),
                'asrama' => $s->asrama_nama ?? ($s->asrama->nama_asrama ?? $s->asrama->nama ?? null),
                'foto_url' => $fotoUrl,
                'saldo_dompet' => $s->wallet ? ($s->wallet->balance ?? 0) : 0,
                'limit_harian' => $transactionLimit ? $transactionLimit->daily_limit : 15000,
                'hubungan' => $tipeWali,
                'nama_wali' => $namaWali,
            ];
        })->toArray();
    }

    /**
     * Track login activity
     * 
     * @param PasswordWali $passwordWali
     * @param string|null $userAgent
     * @return void
     */
    private function trackLogin($passwordWali, ?string $userAgent): void
    {
        $passwordWali->last_mobile_login_at = now();
        $passwordWali->mobile_login_count = ($passwordWali->mobile_login_count ?? 0) + 1;
        $passwordWali->last_mobile_device = $this->detectDevice($userAgent);
        $passwordWali->save();
    }

    /**
     * Normalize phone number to 62xxx format
     * 
     * @param string $phone
     * @return string
     */
    private function normalizePhoneNumber(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        if (substr($phone, 0, 1) === '0') {
            $phone = '62' . substr($phone, 1);
        }
        
        if (substr($phone, 0, 2) !== '62') {
            $phone = '62' . $phone;
        }
        
        return $phone;
    }

    /**
     * Detect device type from user agent
     * 
     * @param string|null $userAgent
     * @return string
     */
    private function detectDevice(?string $userAgent): string
    {
        if (!$userAgent) return 'Unknown';
        
        $ua = strtolower($userAgent);
        
        if (str_contains($ua, 'android')) return 'Android';
        if (str_contains($ua, 'iphone') || str_contains($ua, 'ipad')) return 'iOS';
        if (str_contains($ua, 'mobile')) return 'Mobile Web';
        if (str_contains($ua, 'chrome')) return 'Chrome';
        if (str_contains($ua, 'firefox')) return 'Firefox';
        if (str_contains($ua, 'safari')) return 'Safari';
        
        return 'Desktop/Web';
    }
}
