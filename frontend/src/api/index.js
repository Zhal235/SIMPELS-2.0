import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
const api = axios.create({
    // Default fallback ke http://localhost:8001/api jika VITE_API_BASE tidak diset
    baseURL: import.meta?.env?.VITE_API_BASE || 'http://localhost:8001/api',
    withCredentials: false,
});
// Attach token if available
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        // Axios v1 may use AxiosHeaders instance or a plain object for headers
        const h = config.headers;
        if (h && typeof h.set === 'function') {
            // If AxiosHeaders, prefer using .set for type safety
            h.set('Authorization', `Bearer ${token}`);
        }
        else {
            config.headers = { ...(h || {}), Authorization: `Bearer ${token}` };
        }
    }
    return config;
});
// Handle common error cases
api.interceptors.response.use((res) => res, (err) => {
    const status = err?.response?.status;
    if (status === 401) {
        // Token invalid/expired
        useAuthStore.getState().logout();
    }
    return Promise.reject(err);
});
export async function apiFetch(endpoint, method = 'GET', data, config) {
    const response = await api.request({ url: endpoint, method, data, ...(config || {}) });
    return response.data;
}
export default api;
