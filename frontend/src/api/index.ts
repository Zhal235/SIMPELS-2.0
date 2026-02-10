import axios from 'axios'
import type { AxiosRequestConfig, Method } from 'axios'
import { useAuthStore } from '../stores/useAuthStore'

const api = axios.create({
  // Use environment variable for development, fallback to production URL
  baseURL: import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL || 'https://api.simpels.saza.sch.id/api',
  withCredentials: true,
  // Ensure proper headers for authentication and CORS
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Debug only in development mode
if (import.meta.env.DEV) {
  console.log('API Base URL:', api.defaults.baseURL)
  console.log('Environment variables:', {
    VITE_API_BASE: import.meta.env.VITE_API_BASE,
    VITE_API_URL: import.meta.env.VITE_API_URL
  })
}

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