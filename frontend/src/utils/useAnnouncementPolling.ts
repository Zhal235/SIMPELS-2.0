import { useEffect, useState, useCallback } from 'react'
import { getUnreadCount } from '../api/announcements'

/**
 * Custom hook for polling unread announcements count
 * POLLING DISABLED - Manual refresh only to reduce server load
 * @param intervalMs - Polling interval in milliseconds (TIDAK DIGUNAKAN - polling disabled)
 */
export function useAnnouncementPolling(intervalMs: number = 60000) {
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isPolling, setIsPolling] = useState<boolean>(false)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount()
      if (response.success) {
        setUnreadCount(response.count)
      }
    } catch (error) {
      console.error('Failed to fetch unread announcements count:', error)
    }
  }, [])

  useEffect(() => {
    // Initial fetch only - NO AUTO POLLING
    fetchUnreadCount()
    
    // Polling disabled to reduce server load
    // Badge will only update when:
    // 1. Component mounts (initial load)
    // 2. User manually clicks refresh
    // 3. User opens announcements modal
  }, [fetchUnreadCount])

  return {
    unreadCount,
    isPolling,
    refresh: fetchUnreadCount,
  }
}
