import { useEffect, useState, useCallback } from 'react'
import { getUnreadCount } from '../api/announcements'

/**
 * Custom hook for polling unread announcements count
 * @param intervalMs - Polling interval in milliseconds (default: 60000 = 1 minute)
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
    // Initial fetch
    fetchUnreadCount()
    setIsPolling(true)

    // Set up polling interval
    const intervalId = setInterval(() => {
      fetchUnreadCount()
    }, intervalMs)

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId)
      setIsPolling(false)
    }
  }, [fetchUnreadCount, intervalMs])

  return {
    unreadCount,
    isPolling,
    refresh: fetchUnreadCount,
  }
}
