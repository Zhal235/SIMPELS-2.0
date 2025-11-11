import { apiFetch } from './index'

export interface LoginResponse {
  token: string
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/login', 'POST', { email, password })
}

export async function logout(): Promise<void> {
  return apiFetch('/logout', 'POST')
}

export async function getCurrentUser() {
  return apiFetch('/user', 'GET')
}
