<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MobileMonitoringController extends Controller
{
    /**
     * Get mobile app usage statistics
     */
    public function statistics(Request $request)
    {
        // Total wali santri (users with role 'wali' or similar)
        $totalWali = User::whereIn('role', ['wali', 'wali_santri', 'user'])->count();

        // Wali yang pernah login ke mobile (last_mobile_login_at is not null)
        $waliEverLoggedIn = User::whereIn('role', ['wali', 'wali_santri', 'user'])
            ->whereNotNull('last_mobile_login_at')
            ->count();

        // Wali aktif 7 hari terakhir
        $waliActive7Days = User::whereIn('role', ['wali', 'wali_santri', 'user'])
            ->where('last_mobile_login_at', '>=', now()->subDays(7))
            ->count();

        // Wali aktif 30 hari terakhir
        $waliActive30Days = User::whereIn('role', ['wali', 'wali_santri', 'user'])
            ->where('last_mobile_login_at', '>=', now()->subDays(30))
            ->count();

        // Tingkat adopsi (persentase yang pernah login)
        $adoptionRate = $totalWali > 0 ? round(($waliEverLoggedIn / $totalWali) * 100, 1) : 0;

        // Device distribution
        $deviceDistribution = User::whereIn('role', ['wali', 'wali_santri', 'user'])
            ->whereNotNull('last_mobile_device')
            ->select('last_mobile_device', DB::raw('count(*) as count'))
            ->groupBy('last_mobile_device')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_wali' => $totalWali,
                'wali_ever_logged_in' => $waliEverLoggedIn,
                'wali_active_7_days' => $waliActive7Days,
                'wali_active_30_days' => $waliActive30Days,
                'adoption_rate' => $adoptionRate,
                'device_distribution' => $deviceDistribution,
            ]
        ]);
    }

    /**
     * Get detailed list of wali with mobile login info
     */
    public function waliList(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');
        $status = $request->input('status'); // 'never', 'logged_in', 'active_7', 'active_30'

        $query = User::whereIn('role', ['wali', 'wali_santri', 'user'])
            ->select('id', 'name', 'email', 'last_mobile_login_at', 'mobile_login_count', 'last_mobile_device');

        // Filter by search
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($status === 'never') {
            $query->whereNull('last_mobile_login_at');
        } elseif ($status === 'logged_in') {
            $query->whereNotNull('last_mobile_login_at');
        } elseif ($status === 'active_7') {
            $query->where('last_mobile_login_at', '>=', now()->subDays(7));
        } elseif ($status === 'active_30') {
            $query->where('last_mobile_login_at', '>=', now()->subDays(30));
        }

        $waliList = $query->orderBy('last_mobile_login_at', 'desc')
            ->orderBy('name', 'asc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $waliList
        ]);
    }

    /**
     * Get login trend data for chart (last 30 days)
     */
    public function loginTrend(Request $request)
    {
        $days = $request->input('days', 30);
        
        $trend = DB::table('users')
            ->whereIn('role', ['wali', 'wali_santri', 'user'])
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
}

