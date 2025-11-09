import axios from 'axios'
import type { AxiosRequestConfig, Method } from 'axios'
import { useAuthStore } from '../stores/useAuthStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  withCredentials: false,
})

// Attach token if available
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` }
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
    return Promise.reject(err)
  }
)

export async function apiFetch<T = any>(endpoint: string, method: Method = 'GET', data?: any, config?: AxiosRequestConfig) {
  const response = await api.request<T>({ url: endpoint, method, data, ...(config || {}) })
  return response.data
}

export default api