import api from './index'

export interface Announcement {
  id: number
  title: string
  content: string
  priority: 'normal' | 'important' | 'urgent'
  target_type: 'all' | 'class' | 'santri'
  target_ids: number[] | null
  push_notification: boolean
  created_by: string | null
  created_at: string
  is_read: boolean
}

export interface AnnouncementResponse {
  success: boolean
  data: Announcement[]
  unread_count: number
}

export interface UnreadCountResponse {
  success: boolean
  count: number
}

export interface CreateAnnouncementPayload {
  title: string
  content: string
  priority: 'normal' | 'important' | 'urgent'
  target_type: 'all' | 'class' | 'santri'
  target_ids?: number[]
  push_notification?: boolean
}

/**
 * Get list of announcements
 */
export const getAnnouncements = async (params?: {
  unread_only?: boolean
  limit?: number
}): Promise<AnnouncementResponse> => {
  // Use V1 Admin route for list
  const response = await api.get('/v1/announcements', { params })
  return response.data
}

/**
 * Get unread count for badge
 */
export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  // Use correct V1 endpoint for Wali
  const response = await api.get('/v1/wali/announcements/unread-count')
  return response.data
}

/**
 * Get single announcement
 */
export const getAnnouncement = async (id: number): Promise<{ success: boolean; data: Announcement }> => {
  const response = await api.get(`/wali/announcements/${id}`)
  return response.data
}

/**
 * Mark announcement as read
 */
export const markAsRead = async (id: number): Promise<{ success: boolean; message: string }> => {
  const response = await api.post(`/wali/announcements/${id}/mark-read`)
  return response.data
}

/**
 * Admin: Create new announcement
 */
export const createAnnouncement = async (payload: CreateAnnouncementPayload): Promise<any> => {
  const response = await api.post('/v1/announcements', payload)
  return response.data
}

/**
 * Admin: Update announcement
 */
export const updateAnnouncement = async (id: number, payload: Partial<CreateAnnouncementPayload>): Promise<any> => {
  const response = await api.put(`/v1/announcements/${id}`, payload)
  return response.data
}

/**
 * Admin: Delete announcement
 */
export const deleteAnnouncement = async (id: number): Promise<any> => {
  const response = await api.delete(`/v1/announcements/${id}`)
  return response.data
}

/**
 * Admin: Get kelas options for filter
 */
export const getKelasOptions = async (): Promise<any> => {
  const response = await api.get('/v1/announcements/options/kelas')
  return response.data
}

/**
 * Admin: Get santri options for filter
 */
export const getSantriOptions = async (params?: { kelas_id?: number; search?: string }): Promise<any> => {
  const response = await api.get('/v1/announcements/options/santri', { params })
  return response.data
}
