<?php

namespace App\Services\Mobile;

use App\Models\PasswordWali;
use App\Models\Santri;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * MobileStatsService
 * 
 * Handles mobile app statistics and wali adoption tracking
 * - Overall adoption statistics
 * - Santri/wali login status tracking  
 * - Device distribution analytics
 */
class MobileStatsService
{
    /**
     * Get comprehensive mobile app usage statistics
     */
    public function getOverallStatistics(): array
    {
        $totalSantri = Santri::where('status', 'aktif')->count();
        
        // Get all active santri with their HP
        $santriList = Santri::where('status', 'aktif')
            ->select('id', 'hp_ayah', 'hp_ibu')
            ->get();
        
        $santriWithLogin = 0;
        $santriFullyAdopted = 0;
        
        foreach ($santriList as $santri) {
            $ayahLogin = $this->checkWaliLogin($santri->hp_ayah);
            $ibuLogin = $this->checkWaliLogin($santri->hp_ibu);
            
            // Count santri with at least 1 wali login
            if ($ayahLogin || $ibuLogin) {
                $santriWithLogin++;
            }
            
            // Count santri with both wali login (only if both phone numbers exist)
            if ($ayahLogin && $ibuLogin && $santri->hp_ayah && $santri->hp_ibu) {
                $santriFullyAdopted++;
            }
        }
        
        $santriNeverLogin = $totalSantri - $santriWithLogin;
        $adoptionRate = $totalSantri > 0 ? round(($santriWithLogin / $totalSantri) * 100, 1) : 0;
        
        // Get device distribution
        $deviceDistribution = $this->getDeviceDistribution();

        return [
            'total_santri' => $totalSantri,
            'santri_with_wali_login' => $santriWithLogin,
            'santri_fully_adopted' => $santriFullyAdopted,
            'santri_never_login' => $santriNeverLogin,
            'adoption_rate' => $adoptionRate,
            'device_distribution' => $deviceDistribution,
        ];
    }

    /**
     * Get detailed list of santri with wali login status (with pagination & filtering)
     */
    public function getWaliList(Request $request): array
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $status = $request->input('status'); // 'never', 'partial', 'full'

        $query = Santri::with(['kelas'])
            ->where('status', 'aktif');

        // Apply search filter
        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('nama_santri', 'like', "%{$search}%")
                  ->orWhere('nis', 'like', "%{$search}%")
                  ->orWhere('hp_ayah', 'like', "%{$search}%")
                  ->orWhere('hp_ibu', 'like', "%{$search}%");
            });
        }

        // Get paginated santri data
        $santriList = $query->orderBy('nama_santri', 'asc')->paginate($perPage);

        // Process each santri to get login status
        $data = $santriList->getCollection()->map(function($santri) use ($status) {
            return $this->processSantriLoginStatus($santri, $status);
        });

        // Apply status filter
        if ($status) {
            $data = $data->filter(function($item) {
                return $item['should_include'];
            })->values();
        }

        return [
            'current_page' => $santriList->currentPage(),
            'data' => $data,
            'total' => $santriList->total(),
            'per_page' => $santriList->perPage(),
            'last_page' => $santriList->lastPage(),
        ];
    }

    /**
     * Check if wali has ever logged in to mobile app
     */
    private function checkWaliLogin(?string $noHp): bool
    {
        if (!$noHp) {
            return false;
        }

        return PasswordWali::where('no_hp', $noHp)
            ->whereNotNull('last_mobile_login_at')
            ->exists();
    }

    /**
     * Get device distribution statistics
     */
    private function getDeviceDistribution()
    {
        return PasswordWali::whereNotNull('last_mobile_device')
            ->select('last_mobile_device', DB::raw('count(*) as count'))
            ->groupBy('last_mobile_device')
            ->get();
    }

    /**
     * Process individual santri to get complete login status
     */
    private function processSantriLoginStatus($santri, ?string $statusFilter): array
    {
        // Get ayah login details
        $ayahDetails = $this->getWaliLoginDetails($santri->hp_ayah);
        
        // Get ibu login details  
        $ibuDetails = $this->getWaliLoginDetails($santri->hp_ibu);
        
        // Determine if santri should be included based on filter
        $shouldInclude = $this->shouldIncludeSantri(
            $ayahDetails['has_login'], 
            $ibuDetails['has_login'], 
            $santri->hp_ayah, 
            $santri->hp_ibu, 
            $statusFilter
        );
        
        return [
            'id' => $santri->id,
            'nis' => $santri->nis,
            'nama_santri' => $santri->nama_santri,
            'kelas' => $santri->kelas->nama_kelas ?? '-',
            'hp_ayah' => $santri->hp_ayah,
            'hp_ibu' => $santri->hp_ibu,
            'ayah_login_status' => $ayahDetails['has_login'],
            'ayah_last_login' => $ayahDetails['last_login'],
            'ayah_login_count' => $ayahDetails['login_count'],
            'ayah_device' => $ayahDetails['device'],
            'ibu_login_status' => $ibuDetails['has_login'],
            'ibu_last_login' => $ibuDetails['last_login'],
            'ibu_login_count' => $ibuDetails['login_count'],
            'ibu_device' => $ibuDetails['device'],
            'should_include' => $shouldInclude,
        ];
    }

    /**
     * Get detailed login information for specific wali phone number
     */
    private function getWaliLoginDetails(?string $noHp): array
    {
        if (!$noHp) {
            return [
                'has_login' => false,
                'last_login' => null,
                'login_count' => 0,
                'device' => null,
            ];
        }

        $passwordWali = PasswordWali::where('no_hp', $noHp)->first();
        
        if (!$passwordWali || !$passwordWali->last_mobile_login_at) {
            return [
                'has_login' => false,
                'last_login' => null,
                'login_count' => 0,
                'device' => null,
            ];
        }

        return [
            'has_login' => true,
            'last_login' => $passwordWali->last_mobile_login_at,
            'login_count' => $passwordWali->mobile_login_count ?? 0,
            'device' => $passwordWali->last_mobile_device,
        ];
    }

    /**
     * Determine if santri should be included based on status filter
     */
    private function shouldIncludeSantri(
        bool $ayahLogin, 
        bool $ibuLogin, 
        ?string $hpAyah, 
        ?string $hpIbu, 
        ?string $statusFilter
    ): bool {
        if (!$statusFilter) {
            return true; // No filter, include all
        }

        return match($statusFilter) {
            'never' => !$ayahLogin && !$ibuLogin,
            'partial' => ($ayahLogin && !$ibuLogin) || (!$ayahLogin && $ibuLogin),
            'full' => $ayahLogin && $ibuLogin && $hpAyah && $hpIbu,
            default => true,
        };
    }
}