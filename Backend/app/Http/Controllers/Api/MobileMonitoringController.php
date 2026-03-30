<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PasswordWali;
use App\Models\Santri;
use Illuminate\Support\Facades\DB;

class MobileMonitoringController extends Controller
{
    /**
     * Get mobile app usage statistics based on santri
     */
    public function statistics(Request $request)
    {
        try {
            $totalSantri = Santri::where('status', 'aktif')->count();
            
            // Get all active santri with their HP
            $santriList = Santri::where('status', 'aktif')
                ->select('id', 'hp_ayah', 'hp_ibu')
                ->get();
            
            $santriWithLogin = 0;
            $santriFullyAdopted = 0;
            
            foreach ($santriList as $santri) {
                $ayahLogin = false;
                $ibuLogin = false;
                
                if ($santri->hp_ayah) {
                    $ayahLogin = PasswordWali::where('no_hp', $santri->hp_ayah)
                        ->whereNotNull('last_mobile_login_at')
                        ->exists();
                }
                
                if ($santri->hp_ibu) {
                    $ibuLogin = PasswordWali::where('no_hp', $santri->hp_ibu)
                        ->whereNotNull('last_mobile_login_at')
                        ->exists();
                }
                
                // Count santri with at least 1 wali login
                if ($ayahLogin || $ibuLogin) {
                    $santriWithLogin++;
                }
                
                // Count santri with both wali login
                if ($ayahLogin && $ibuLogin && $santri->hp_ayah && $santri->hp_ibu) {
                    $santriFullyAdopted++;
                }
            }
            
            $santriNeverLogin = $totalSantri - $santriWithLogin;
            $adoptionRate = $totalSantri > 0 ? round(($santriWithLogin / $totalSantri) * 100, 1) : 0;
            
            // Device distribution
            $deviceDistribution = PasswordWali::whereNotNull('last_mobile_device')
                ->select('last_mobile_device', DB::raw('count(*) as count'))
                ->groupBy('last_mobile_device')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_santri' => $totalSantri,
                    'santri_with_wali_login' => $santriWithLogin,
                    'santri_fully_adopted' => $santriFullyAdopted,
                    'santri_never_login' => $santriNeverLogin,
                    'adoption_rate' => $adoptionRate,
                    'device_distribution' => $deviceDistribution,
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in statistics: ' . $e->getMessage());
            return response()->json([
                'success' => true,
                'data' => [
                    'total_santri' => 0,
                    'santri_with_wali_login' => 0,
                    'santri_fully_adopted' => 0,
                    'santri_never_login' => 0,
                    'adoption_rate' => 0,
                    'device_distribution' => [],
                ]
            ]);
        }
    }

    /**
     * Get detailed list of santri with wali login status
     */
    public function waliList(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $status = $request->input('status'); // 'never', 'partial', 'full'

        try {
            $query = Santri::with(['kelas'])
                ->where('status', 'aktif');

            // Filter by search (nama santri atau nomor HP)
            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('nama_santri', 'like', "%{$search}%")
                      ->orWhere('nis', 'like', "%{$search}%")
                      ->orWhere('hp_ayah', 'like', "%{$search}%")
                      ->orWhere('hp_ibu', 'like', "%{$search}%");
                });
            }

            // Get santri data
            $santriList = $query->orderBy('nama_santri', 'asc')->paginate($perPage);

            // Manually fetch password_wali data for each santri
            $data = $santriList->getCollection()->map(function($santri) {
                $ayahLogin = false;
                $ayahLastLogin = null;
                $ayahLoginCount = 0;
                $ayahDevice = null;
                
                $ibuLogin = false;
                $ibuLastLogin = null;
                $ibuLoginCount = 0;
                $ibuDevice = null;
                
                // Check ayah login status
                if ($santri->hp_ayah) {
                    $passwordAyah = PasswordWali::where('no_hp', $santri->hp_ayah)->first();
                    if ($passwordAyah && $passwordAyah->last_mobile_login_at) {
                        $ayahLogin = true;
                        $ayahLastLogin = $passwordAyah->last_mobile_login_at;
                        $ayahLoginCount = $passwordAyah->mobile_login_count ?? 0;
                        $ayahDevice = $passwordAyah->last_mobile_device;
                    }
                }
                
                // Check ibu login status
                if ($santri->hp_ibu) {
                    $passwordIbu = PasswordWali::where('no_hp', $santri->hp_ibu)->first();
                    if ($passwordIbu && $passwordIbu->last_mobile_login_at) {
                        $ibuLogin = true;
                        $ibuLastLogin = $passwordIbu->last_mobile_login_at;
                        $ibuLoginCount = $passwordIbu->mobile_login_count ?? 0;
                        $ibuDevice = $passwordIbu->last_mobile_device;
                    }
                }
                
                // Apply status filter
                $shouldInclude = true;
                if ($status === 'never') {
                    $shouldInclude = !$ayahLogin && !$ibuLogin;
                } elseif ($status === 'partial') {
                    $shouldInclude = ($ayahLogin && !$ibuLogin) || (!$ayahLogin && $ibuLogin);
                } elseif ($status === 'full') {
                    $shouldInclude = $ayahLogin && $ibuLogin && $santri->hp_ayah && $santri->hp_ibu;
                }
                
                return [
                    'id' => $santri->id,
                    'nis' => $santri->nis,
                    'nama_santri' => $santri->nama_santri,
                    'kelas' => $santri->kelas->nama_kelas ?? '-',
                    'hp_ayah' => $santri->hp_ayah,
                    'hp_ibu' => $santri->hp_ibu,
                    'ayah_login_status' => $ayahLogin,
                    'ayah_last_login' => $ayahLastLogin,
                    'ayah_login_count' => $ayahLoginCount,
                    'ayah_device' => $ayahDevice,
                    'ibu_login_status' => $ibuLogin,
                    'ibu_last_login' => $ibuLastLogin,
                    'ibu_login_count' => $ibuLoginCount,
                    'ibu_device' => $ibuDevice,
                    'should_include' => $shouldInclude,
                ];
            });

            // Filter by status if specified
            if ($status) {
                $data = $data->filter(function($item) {
                    return $item['should_include'];
                })->values();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'current_page' => $santriList->currentPage(),
                    'data' => $data,
                    'total' => $santriList->total(),
                    'per_page' => $santriList->perPage(),
                    'last_page' => $santriList->lastPage(),
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in waliList: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error loading data: ' . $e->getMessage(),
                'data' => [
                    'current_page' => 1,
                    'data' => [],
                    'total' => 0,
                    'per_page' => 15,
                    'last_page' => 1,
                ]
            ], 500);
        }
    }

    /**
     * Get login trend data for chart (last 30 days)
     */
    public function loginTrend(Request $request)
    {
        $days = $request->input('days', 30);
        
        $trend = DB::table('password_wali')
            ->whereNotNull('last_mobile_login_at')
            ->where('last_mobile_login_at', '>=', now()->subDays($days))
            ->select(
                DB::raw('DATE(last_mobile_login_at) as date'),
                DB::raw('COUNT(DISTINCT id) as count')
            )
            ->groupBy('date')
            ->orderBy('date', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $trend
        ]);
    }

    /**
     * Get daily active users (DAU) trend
     */
    public function dailyActiveUsers(Request $request)
    {
        $days = $request->input('days', 30);
        
        try {
            $dau = DB::table('mobile_activity_logs')
                ->where('created_at', '>=', now()->subDays($days))
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(DISTINCT no_hp) as count')
                )
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $dau
            ]);
        } catch (\Exception $e) {
            // Table doesn't exist yet, return empty data
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * Get most used features/actions
     */
    public function popularFeatures(Request $request)
    {
        $days = $request->input('days', 7);
        
        try {
            $features = DB::table('mobile_activity_logs')
                ->where('created_at', '>=', now()->subDays($days))
                ->select('feature', 'action', DB::raw('COUNT(*) as count'))
                ->whereNotNull('feature')
                ->groupBy('feature', 'action')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $features
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * Get peak usage hours
     */
    public function peakHours(Request $request)
    {
        $days = $request->input('days', 7);
        
        try {
            $hours = DB::table('mobile_activity_logs')
                ->where('created_at', '>=', now()->subDays($days))
                ->select(
                    DB::raw('HOUR(created_at) as hour'),
                    DB::raw('COUNT(*) as count')
                )
                ->groupBy('hour')
                ->orderBy('hour', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $hours
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * Get real-time stats (today)
     */
    public function realTimeStats(Request $request)
    {
        $today = now()->startOfDay();
        
        try {
            $stats = [
                'active_users_today' => DB::table('mobile_activity_logs')
                    ->where('created_at', '>=', $today)
                    ->distinct('no_hp')
                    ->count('no_hp'),
                
                'total_activities_today' => DB::table('mobile_activity_logs')
                    ->where('created_at', '>=', $today)
                    ->count(),
                
                'avg_response_time' => DB::table('mobile_activity_logs')
                    ->where('created_at', '>=', $today)
                    ->whereNotNull('response_time')
                    ->avg('response_time'),
                
                'top_feature_today' => DB::table('mobile_activity_logs')
                    ->where('created_at', '>=', $today)
                    ->select('feature', DB::raw('COUNT(*) as count'))
                    ->whereNotNull('feature')
                    ->groupBy('feature')
                    ->orderBy('count', 'desc')
                    ->first(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => true,
                'data' => [
                    'active_users_today' => 0,
                    'total_activities_today' => 0,
                    'avg_response_time' => 0,
                    'top_feature_today' => null,
                ]
            ]);
        }
    }

    /**
     * Get activity by specific wali (no_hp)
     */
    public function waliActivity(Request $request, $no_hp)
    {
        $days = $request->input('days', 30);
        
        $activities = DB::table('mobile_activity_logs')
            ->where('no_hp', $no_hp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('action', 'feature', 'created_at', 'device', 'response_time')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();

        $summary = [
            'total_activities' => $activities->count(),
            'last_active' => $activities->first()?->created_at,
            'most_used_feature' => DB::table('mobile_activity_logs')
                ->where('no_hp', $no_hp)
                ->where('created_at', '>=', now()->subDays($days))
                ->select('feature', DB::raw('COUNT(*) as count'))
                ->groupBy('feature')
                ->orderBy('count', 'desc')
                ->first(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => $summary,
                'activities' => $activities
            ]
        ]);
    }
}


