import axios from 'axios'
import type { AxiosRequestConfig, Method } from 'axios'
import { useAuthStore } from '../stores/useAuthStore'

const api = axios.create({
  // Default fallback ke https://api.saza.sch.id/api jika VITE_API_BASE tidak diset
  // Menggunakan domain publik agar bisa diakses dari device lain
  baseURL: (import.meta as any)?.env?.VITE_API_BASE || 'https://api.saza.sch.id/api',
  withCredentials: true,
  // Ensure proper headers for authentication and CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Attach token if available
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    // Axios v1 may use AxiosHeaders instance or a plain object for headers
    const h = config.headers as any
    if (h && typeof h.set === 'function') {
      // If AxiosHeaders, prefer using .set for type safety
      h.set('Authorization', `Bearer ${token}`)
    } else {
      config.headers = { ...(h || {}), Authorization: `Bearer ${token}` } as any
    }
  }
  return config
})

// Handle common error cases
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      // Token invalid/expired
      useAuthStore.getState().logout()
    }
    // Log 405 errors for debugging
    if (status === 405) {
      console.error('405 Method Not Allowed:', {
        method: err?.config?.method,
        url: err?.config?.url,
        baseURL: err?.config?.baseURL,
      })
    }
    return Promise.reject(err)
  }
)

export async function apiFetch<T = any>(endpoint: string, method: Method = 'GET', data?: any, config?: AxiosRequestConfig) {
  const response = await api.request<T>({ url: endpoint, method, data, ...(config || {}) })
  return response.data
}

export default api