<?php

namespace App\Services\Mobile;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * MobileAnalyticsService
 * 
 * Handles mobile app analytics and trending data
 * - Login trends and patterns
 * - Daily Active Users (DAU)
 * - Feature usage analytics
 * - Peak hours analysis
 * - Real-time statistics
 */
class MobileAnalyticsService
{
    /**
     * Get login trend data for charts (configurable days)
     */
    public function getLoginTrend(int $days = 30): array
    {
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

        return $trend->toArray();
    }

    /**
     * Get Daily Active Users (DAU) trend
     */
    public function getDailyActiveUsers(int $days = 30): array
    {
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

            return $dau->toArray();
        } catch (\Exception $e) {
            // Table doesn't exist yet or other database issues
            return [];
        }
    }

    /**
     * Get most used features/actions in the mobile app
     */
    public function getPopularFeatures(int $days = 7): array
    {
        try {
            $features = DB::table('mobile_activity_logs')
                ->where('created_at', '>=', now()->subDays($days))
                ->select('feature', 'action', DB::raw('COUNT(*) as count'))
                ->whereNotNull('feature')
                ->groupBy('feature', 'action')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            return $features->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get peak usage hours analysis
     */
    public function getPeakHours(int $days = 7): array
    {
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

            return $hours->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get real-time statistics for today
     */
    public function getRealTimeStats(): array
    {
        $today = now()->startOfDay();
        
        try {
            $stats = [
                'active_users_today' => $this->getActiveUsersToday($today),
                'total_activities_today' => $this->getTotalActivitiesToday($today),
                'avg_response_time' => $this->getAverageResponseTime($today),
                'top_feature_today' => $this->getTopFeatureToday($today),
            ];

            return $stats;
        } catch (\Exception $e) {
            return [
                'active_users_today' => 0,
                'total_activities_today' => 0,
                'avg_response_time' => 0,
                'top_feature_today' => null,
            ];
        }
    }

    /**
     * Get comprehensive analytics dashboard data
     */
    public function getDashboardAnalytics(Request $request): array
    {
        $days = $request->input('days', 30);
        
        return [
            'login_trend' => $this->getLoginTrend($days),
            'daily_active_users' => $this->getDailyActiveUsers($days),
            'popular_features' => $this->getPopularFeatures(min($days, 7)), // Max 7 days for features
            'peak_hours' => $this->getPeakHours(min($days, 7)),
            'real_time_stats' => $this->getRealTimeStats(),
        ];
    }

    /**
     * Get activity trends comparison (current vs previous period)
     */
    public function getActivityComparison(int $days = 30): array
    {
        $currentPeriod = $this->getPeriodStats(0, $days);
        $previousPeriod = $this->getPeriodStats($days, $days);
        
        return [
            'current_period' => $currentPeriod,
            'previous_period' => $previousPeriod,
            'growth_rate' => $this->calculateGrowthRate($currentPeriod, $previousPeriod),
        ];
    }

    /**
     * Get active users count for today
     */
    private function getActiveUsersToday($today): int
    {
        return DB::table('mobile_activity_logs')
            ->where('created_at', '>=', $today)
            ->distinct('no_hp')
            ->count('no_hp');
    }

    /**
     * Get total activities count for today
     */
    private function getTotalActivitiesToday($today): int
    {
        return DB::table('mobile_activity_logs')
            ->where('created_at', '>=', $today)
            ->count();
    }

    /**
     * Get average response time for today
     */
    private function getAverageResponseTime($today): float
    {
        $avg = DB::table('mobile_activity_logs')
            ->where('created_at', '>=', $today)
            ->whereNotNull('response_time')
            ->avg('response_time');
            
        return round((float)$avg, 2);
    }

    /**
     * Get top feature used today
     */
    private function getTopFeatureToday($today)
    {
        return DB::table('mobile_activity_logs')
            ->where('created_at', '>=', $today)
            ->select('feature', DB::raw('COUNT(*) as count'))
            ->whereNotNull('feature')
            ->groupBy('feature')
            ->orderBy('count', 'desc')
            ->first();
    }

    /**
     * Get statistics for a specific period
     */
    private function getPeriodStats(int $daysAgo, int $duration): array
    {
        $endDate = now()->subDays($daysAgo);
        $startDate = $endDate->copy()->subDays($duration);
        
        try {
            return [
                'active_users' => DB::table('mobile_activity_logs')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->distinct('no_hp')
                    ->count('no_hp'),
                    
                'total_activities' => DB::table('mobile_activity_logs')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count(),
                    
                'avg_response_time' => DB::table('mobile_activity_logs')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->whereNotNull('response_time')
                    ->avg('response_time'),
            ];
        } catch (\Exception $e) {
            return [
                'active_users' => 0,
                'total_activities' => 0,
                'avg_response_time' => 0,
            ];
        }
    }

    /**
     * Calculate growth rate between two periods
     */
    private function calculateGrowthRate(array $current, array $previous): array
    {
        $growthRate = [];
        
        foreach ($current as $key => $value) {
            $previousValue = $previous[$key] ?? 0;
            
            if ($previousValue > 0) {
                $growthRate[$key] = round((($value - $previousValue) / $previousValue) * 100, 1);
            } else {
                $growthRate[$key] = $value > 0 ? 100 : 0;
            }
        }
        
        return $growthRate;
    }

    /**
     * Get usage patterns by day of week
     */
    public function getWeeklyUsagePattern(int $weeks = 4): array
    {
        try {
            $pattern = DB::table('mobile_activity_logs')
                ->where('created_at', '>=', now()->subWeeks($weeks))
                ->select(
                    DB::raw('DAYOFWEEK(created_at) as day_of_week'),
                    DB::raw('COUNT(*) as count')
                )
                ->groupBy('day_of_week')
                ->orderBy('day_of_week')
                ->get();

            return $pattern->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get feature adoption rate over time
     */
    public function getFeatureAdoptionRate(string $feature, int $days = 30): array
    {
        try {
            $adoption = DB::table('mobile_activity_logs')
                ->where('feature', $feature)
                ->where('created_at', '>=', now()->subDays($days))
                ->select(
                    DB::raw('DATE(created_at) as date'),
                    DB::raw('COUNT(DISTINCT no_hp) as unique_users'),
                    DB::raw('COUNT(*) as total_usage')
                )
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            return $adoption->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }
}