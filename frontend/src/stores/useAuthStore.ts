import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = {
  id?: number
  name?: string
  email?: string
  role?: string
}

type AuthState = {
  token: string | null
  user: User | null
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-store', // localStorage key
    }
  )
)