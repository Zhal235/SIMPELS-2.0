import { apiFetch } from './index'

export interface MobileMonitoringStats {
  total_wali: number
  wali_ever_logged_in: number
  wali_active_7_days: number
  wali_active_30_days: number
  adoption_rate: number
  device_distribution: {
    last_mobile_device: string
    count: number
  }[]
}

export interface WaliMobileInfo {
  id: number
  name: string
  email: string
  last_mobile_login_at: string | null
  mobile_login_count: number
  last_mobile_device: string | null
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
