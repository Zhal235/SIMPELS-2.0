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
        $totalSantri = Santri::where('status', 'aktif')->count();
        
        // Santri yang minimal 1 wali sudah login
        $santriWithLoginQuery = Santri::where('status', 'aktif')
            ->where(function($q) {
                $q->whereHas('passwordWaliAyah', function($query) {
                    $query->whereNotNull('last_mobile_login_at');
                })
                ->orWhereHas('passwordWaliIbu', function($query) {
                    $query->whereNotNull('last_mobile_login_at');
                });
            });
        
        $santriWithLogin = $santriWithLoginQuery->count();
        
        // Santri yang kedua wali (ayah & ibu) sudah login
        $santriFullyAdopted = Santri::where('status', 'aktif')
            ->whereNotNull('hp_ayah')
            ->whereNotNull('hp_ibu')
            ->whereHas('passwordWaliAyah', function($query) {
                $query->whereNotNull('last_mobile_login_at');
            })
            ->whereHas('passwordWaliIbu', function($query) {
                $query->whereNotNull('last_mobile_login_at');
            })
            ->count();
        
        // Santri yang belum ada wali yang login
        $santriNeverLogin = $totalSantri - $santriWithLogin;
        
        // Adoption rate
        $adoptionRate = $totalSantri > 0 ? round(($santriWithLogin / $totalSantri) * 100, 1) : 0;
        
        // Device distribution dari password_wali
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
    }

    /**
     * Get detailed list of santri with wali login status
     */
    public function waliList(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $status = $request->input('status'); // 'never', 'partial', 'full'

        $query = Santri::with(['kelas', 'passwordWaliAyah', 'passwordWaliIbu'])
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

        // Filter by adoption status
        if ($status === 'never') {
            // Belum ada satupun wali yang login
            $query->where(function($q) {
                $q->whereDoesntHave('passwordWaliAyah', function($query) {
                    $query->whereNotNull('last_mobile_login_at');
                })
                ->whereDoesntHave('passwordWaliIbu', function($query) {
                    $query->whereNotNull('last_mobile_login_at');
                });
            });
        } elseif ($status === 'partial') {
            // Hanya 1 wali yang login (ayah atau ibu saja)
            $query->where(function($q) {
                $q->where(function($q2) {
                    // Ayah login, ibu belum
                    $q2->whereHas('passwordWaliAyah', function($query) {
                        $query->whereNotNull('last_mobile_login_at');
                    })
                    ->where(function($q3) {
                        $q3->whereNull('hp_ibu')
                           ->orWhereDoesntHave('passwordWaliIbu', function($query) {
                               $query->whereNotNull('last_mobile_login_at');
                           });
                    });
                })
                ->orWhere(function($q2) {
                    // Ibu login, ayah belum
                    $q2->whereHas('passwordWaliIbu', function($query) {
                        $query->whereNotNull('last_mobile_login_at');
                    })
                    ->where(function($q3) {
                        $q3->whereNull('hp_ayah')
                           ->orWhereDoesntHave('passwordWaliAyah', function($query) {
                               $query->whereNotNull('last_mobile_login_at');
                           });
                    });
                });
            });
        } elseif ($status === 'full') {
            // Kedua wali sudah login
            $query->whereNotNull('hp_ayah')
                ->whereNotNull('hp_ibu')
                ->whereHas('passwordWaliAyah', function($query) {
                    $query->whereNotNull('last_mobile_login_at');
                })
                ->whereHas('passwordWaliIbu', function($query) {
                    $query->whereNotNull('last_mobile_login_at');
                });
        }

        $santriList = $query->orderBy('nama_santri', 'asc')->paginate($perPage);

        // Format response
        $data = $santriList->getCollection()->map(function($santri) {
            $ayahLogin = $santri->passwordWaliAyah && $santri->passwordWaliAyah->last_mobile_login_at ? true : false;
            $ibuLogin = $santri->passwordWaliIbu && $santri->passwordWaliIbu->last_mobile_login_at ? true : false;
            
            return [
                'id' => $santri->id,
                'nis' => $santri->nis,
                'nama_santri' => $santri->nama_santri,
                'kelas' => $santri->kelas->nama_kelas ?? '-',
                'hp_ayah' => $santri->hp_ayah,
                'hp_ibu' => $santri->hp_ibu,
                'ayah_login_status' => $ayahLogin,
                'ayah_last_login' => $santri->passwordWaliAyah?->last_mobile_login_at,
                'ayah_login_count' => $santri->passwordWaliAyah?->mobile_login_count ?? 0,
                'ayah_device' => $santri->passwordWaliAyah?->last_mobile_device,
                'ibu_login_status' => $ibuLogin,
                'ibu_last_login' => $santri->passwordWaliIbu?->last_mobile_login_at,
                'ibu_login_count' => $santri->passwordWaliIbu?->mobile_login_count ?? 0,
                'ibu_device' => $santri->passwordWaliIbu?->last_mobile_device,
            ];
        });

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


