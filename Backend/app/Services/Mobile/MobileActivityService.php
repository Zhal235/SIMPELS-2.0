<?php

namespace App\Services\Mobile;

use Illuminate\Support\Facades\DB;

/**
 * MobileActivityService
 * 
 * Handles individual user activity tracking and wali-specific data
 * - Wali activity logs and history
 * - User behavior tracking
 * - Activity summaries and insights
 */
class MobileActivityService
{
    /**
     * Get activity data for specific wali (no_hp)
     */
    public function getWaliActivity(string $noHp, int $days = 30): array
    {
        try {
            // Get recent activities
            $activities = $this->getWaliActivityLogs($noHp, $days);
            
            // Get activity summary
            $summary = $this->getWaliActivitySummary($noHp, $days);
            
            return [
                'summary' => $summary,
                'activities' => $activities
            ];
        } catch (\Exception $e) {
            return [
                'summary' => [
                    'total_activities' => 0,
                    'unique_days' => 0,
                    'avg_daily_usage' => 0,
                    'most_used_feature' => null,
                ],
                'activities' => []
            ];
        }
    }

    /**
     * Get detailed activity logs for specific wali
     */
    public function getWaliActivityLogs(string $noHp, int $days = 30): array
    {
        try {
            $activities = DB::table('mobile_activity_logs')
                ->where('no_hp', $noHp)
                ->where('created_at', '>=', now()->subDays($days))
                ->select('action', 'feature', 'created_at', 'device', 'response_time')
                ->orderBy('created_at', 'desc')
                ->limit(100) // Limit to recent 100 activities
                ->get();

            return $activities->toArray();
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get activity summary for specific wali
     */
    public function getWaliActivitySummary(string $noHp, int $days = 30): array
    {
        try {
            return [
                'total_activities' => $this->getTotalActivities($noHp, $days),
                'unique_days' => $this->getUniqueDaysActive($noHp, $days),
                'avg_daily_usage' => $this->getAverageDailyUsage($noHp, $days),
                'most_used_feature' => $this->getMostUsedFeature($noHp, $days),
                'activity_by_hour' => $this->getActivityByHour($noHp, $days),
                'feature_usage_breakdown' => $this->getFeatureUsageBreakdown($noHp, $days),
                'recent_devices' => $this->getRecentDevices($noHp, $days),
            ];
        } catch (\Exception $e) {
            return [
                'total_activities' => 0,
                'unique_days' => 0,
                'avg_daily_usage' => 0,
                'most_used_feature' => null,
                'activity_by_hour' => [],
                'feature_usage_breakdown' => [],
                'recent_devices' => [],
            ];
        }
    }

    /**
     * Get activity insights for multiple wali (batch processing)
     */
    public function getBatchWaliInsights(array $noHpList, int $days = 7): array
    {
        $insights = [];
        
        foreach ($noHpList as $noHp) {
            $insights[$noHp] = [
                'activity_score' => $this->calculateActivityScore($noHp, $days),
                'engagement_level' => $this->getEngagementLevel($noHp, $days),
                'preferred_features' => $this->getPreferredFeatures($noHp, $days),
                'usage_pattern' => $this->getUsagePattern($noHp, $days),
            ];
        }
        
        return $insights;
    }

    /**
     * Log new mobile activity (for future use)
     */
    public function logActivity(array $activityData): bool
    {
        try {
            DB::table('mobile_activity_logs')->insert([
                'no_hp' => $activityData['no_hp'],
                'feature' => $activityData['feature'] ?? null,
                'action' => $activityData['action'] ?? null,
                'device' => $activityData['device'] ?? null,
                'response_time' => $activityData['response_time'] ?? null,
                'ip_address' => $activityData['ip_address'] ?? null,
                'user_agent' => $activityData['user_agent'] ?? null,
                'created_at' => now(),
            ]);
            
            return true;
        } catch (\Exception $e) {
            \Log::error('Failed to log mobile activity: ' . $e->getMessage(), $activityData);
            return false;
        }
    }

    /**
     * Get total activities for wali
     */
    private function getTotalActivities(string $noHp, int $days): int
    {
        return DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->count();
    }

    /**
     * Get unique days the wali was active
     */
    private function getUniqueDaysActive(string $noHp, int $days): int
    {
        $count = DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select(DB::raw('COUNT(DISTINCT DATE(created_at)) as unique_days'))
            ->first();
            
        return $count->unique_days ?? 0;
    }

    /**
     * Get average daily usage
     */
    private function getAverageDailyUsage(string $noHp, int $days): float
    {
        $uniqueDays = $this->getUniqueDaysActive($noHp, $days);
        $totalActivities = $this->getTotalActivities($noHp, $days);
        
        return $uniqueDays > 0 ? round($totalActivities / $uniqueDays, 1) : 0;
    }

    /**
     * Get most used feature
     */
    private function getMostUsedFeature(string $noHp, int $days)
    {
        return DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('feature', DB::raw('COUNT(*) as count'))
            ->whereNotNull('feature')
            ->groupBy('feature')
            ->orderBy('count', 'desc')
            ->first();
    }

    /**
     * Get activity breakdown by hour
     */
    private function getActivityByHour(string $noHp, int $days): array
    {
        $activities = DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('hour')
            ->orderBy('hour')
            ->get();
            
        return $activities->toArray();
    }

    /**
     * Get feature usage breakdown
     */
    private function getFeatureUsageBreakdown(string $noHp, int $days): array
    {
        $features = DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('feature', DB::raw('COUNT(*) as count'))
            ->whereNotNull('feature')
            ->groupBy('feature')
            ->orderBy('count', 'desc')
            ->get();
            
        return $features->toArray();
    }

    /**
     * Get recent devices used
     */
    private function getRecentDevices(string $noHp, int $days): array
    {
        $devices = DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('device', DB::raw('COUNT(*) as count'), DB::raw('MAX(created_at) as last_used'))
            ->whereNotNull('device')
            ->groupBy('device')
            ->orderBy('last_used', 'desc')
            ->get();
            
        return $devices->toArray();
    }

    /**
     * Calculate activity score (0-100)
     */
    private function calculateActivityScore(string $noHp, int $days): int
    {
        $totalActivities = $this->getTotalActivities($noHp, $days);
        $uniqueDays = $this->getUniqueDaysActive($noHp, $days);
        
        // Simple scoring algorithm
        $frequencyScore = min(($totalActivities / $days) * 10, 50); // Max 50 points for frequency
        $consistencyScore = min(($uniqueDays / $days) * 50, 50); // Max 50 points for consistency
        
        return round($frequencyScore + $consistencyScore);
    }

    /**
     * Get engagement level (low, medium, high)
     */
    private function getEngagementLevel(string $noHp, int $days): string
    {
        $score = $this->calculateActivityScore($noHp, $days);
        
        if ($score >= 70) return 'high';
        if ($score >= 40) return 'medium';
        return 'low';
    }

    /**
     * Get preferred features (top 3)
     */
    private function getPreferredFeatures(string $noHp, int $days): array
    {
        $features = DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select('feature', DB::raw('COUNT(*) as count'))
            ->whereNotNull('feature')
            ->groupBy('feature')
            ->orderBy('count', 'desc')
            ->limit(3)
            ->get();
            
        return $features->pluck('feature')->toArray();
    }

    /**
     * Get usage pattern (morning, afternoon, evening, night)
     */
    private function getUsagePattern(string $noHp, int $days): string
    {
        $hourlyUsage = DB::table('mobile_activity_logs')
            ->where('no_hp', $noHp)
            ->where('created_at', '>=', now()->subDays($days))
            ->select(
                DB::raw('
                    CASE 
                        WHEN HOUR(created_at) BETWEEN 6 AND 11 THEN "morning"
                        WHEN HOUR(created_at) BETWEEN 12 AND 17 THEN "afternoon" 
                        WHEN HOUR(created_at) BETWEEN 18 AND 22 THEN "evening"
                        ELSE "night"
                    END as period
                '),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('period')
            ->orderBy('count', 'desc')
            ->first();
            
        return $hourlyUsage->period ?? 'unknown';
    }
}