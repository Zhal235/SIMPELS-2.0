import { apiFetch } from './index';
export async function login(email, password) {
    return apiFetch('/login', 'POST', { email, password });
}
export async function logout() {
    return apiFetch('/logout', 'POST');
}
export async function getCurrentUser() {
    return apiFetch('/user', 'GET');
}
