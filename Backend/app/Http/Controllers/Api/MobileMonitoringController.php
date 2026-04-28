<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Mobile\MobileStatsService;
use App\Services\Mobile\MobileAnalyticsService;
use App\Services\Mobile\MobileActivityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * MobileMonitoringController - Refactored Thin Controller
 * 
 * Handles mobile app monitoring and analytics with clean separation of concerns:
 * - Overall statistics and wali adoption tracking
 * - Analytics trends and patterns
 * - Individual wali activity tracking
 * 
 * Business logic delegated to specialized services:
 * - MobileStatsService: Statistics and adoption metrics
 * - MobileAnalyticsService: Trends, charts, and analytics
 * - MobileActivityService: Individual user activity tracking
 */
class MobileMonitoringController extends Controller
{
    public function __construct(
        private MobileStatsService $statsService,
        private MobileAnalyticsService $analyticsService,
        private MobileActivityService $activityService
    ) {}

    /**
     * Get mobile app usage statistics based on santri
     */
    public function statistics(Request $request)
    {
        try {
            $data = $this->statsService->getOverallStatistics();

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error in statistics: ' . $e->getMessage());
            
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
        try {
            $data = $this->statsService->getWaliList($request);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            Log::error('Error in waliList: ' . $e->getMessage());
            
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
        $trend = $this->analyticsService->getLoginTrend($days);

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
        $dau = $this->analyticsService->getDailyActiveUsers($days);

        return response()->json([
            'success' => true,
            'data' => $dau
        ]);
    }

    /**
     * Get most used features/actions
     */
    public function popularFeatures(Request $request)
    {
        $days = $request->input('days', 7);
        $features = $this->analyticsService->getPopularFeatures($days);

        return response()->json([
            'success' => true,
            'data' => $features
        ]);
    }

    /**
     * Get peak usage hours
     */
    public function peakHours(Request $request)
    {
        $days = $request->input('days', 7);
        $hours = $this->analyticsService->getPeakHours($days);

        return response()->json([
            'success' => true,
            'data' => $hours
        ]);
    }

    /**
     * Get real-time stats (today)
     */
    public function realTimeStats(Request $request)
    {
        $stats = $this->analyticsService->getRealTimeStats();

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get activity by specific wali (no_hp)
     */
    public function waliActivity(Request $request, $no_hp)
    {
        $days = $request->input('days', 30);
        $data = $this->activityService->getWaliActivity($no_hp, $days);

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }
}
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


