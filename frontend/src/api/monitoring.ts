import { apiFetch } from './index'

export interface MobileMonitoringStats {
  total_santri: number
  santri_with_wali_login: number
  santri_fully_adopted: number
  santri_never_login: number
  adoption_rate: number
  device_distribution: Array<{
    last_mobile_device: string
    count: number
  }>
}

export interface WaliMobileInfo {
  id: number
  nis: string
  nama_santri: string
  kelas: string
  hp_ayah: string | null
  hp_ibu: string | null
  ayah_login_status: boolean
  ayah_last_login: string | null
  ayah_login_count: number
  ayah_device: string | null
  ibu_login_status: boolean
  ibu_last_login: string | null
  ibu_login_count: number
  ibu_device: string | null
}

export interface WaliListResponse {
  current_page: number
  data: WaliMobileInfo[]
  total: number
  per_page: number
  last_page: number
}

export interface LoginTrendData {
  date: string
  count: number
}

export async function getMobileStatistics(): Promise<{ success: boolean; data: MobileMonitoringStats }> {
  return apiFetch('/admin/mobile-monitoring/statistics', 'GET')
}

export async function getWaliList(params?: {
  page?: number
  per_page?: number
  search?: string
  status?: 'never' | 'logged_in' | 'active_7' | 'active_30'
}): Promise<{ success: boolean; data: WaliListResponse }> {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.per_page) queryParams.append('per_page', params.per_page.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.status) queryParams.append('status', params.status)
  
  const url = `/admin/mobile-monitoring/wali-list${queryParams.toString() ? '?' + queryParams.toString() : ''}`
  return apiFetch(url, 'GET')
}

export async function getLoginTrend(days = 30): Promise<{ success: boolean; data: LoginTrendData[] }> {
  return apiFetch(`/admin/mobile-monitoring/login-trend?days=${days}`, 'GET')
}

export async function getDailyActiveUsers(days = 30): Promise<{ success: boolean; data: LoginTrendData[] }> {
  return apiFetch(`/admin/mobile-monitoring/daily-active-users?days=${days}`, 'GET')
}

export async function getPopularFeatures(days = 7): Promise<{ success: boolean; data: Array<{feature: string; action: string; count: number}> }> {
  return apiFetch(`/admin/mobile-monitoring/popular-features?days=${days}`, 'GET')
}

export async function getPeakHours(days = 7): Promise<{ success: boolean; data: Array<{hour: number; count: number}> }> {
  return apiFetch(`/admin/mobile-monitoring/peak-hours?days=${days}`, 'GET')
}

export interface RealTimeStats {
  active_users_today: number
  total_activities_today: number
  avg_response_time: number
  top_feature_today: { feature: string; count: number } | null
}

export async function getRealTimeStats(): Promise<{ success: boolean; data: RealTimeStats }> {
  return apiFetch('/admin/mobile-monitoring/realtime-stats', 'GET')
}

export async function getWaliActivity(noHp: string, days = 30) {
  return apiFetch(`/admin/mobile-monitoring/wali-activity/${noHp}?days=${days}`, 'GET')
}
