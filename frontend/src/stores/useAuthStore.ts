import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type User = {
  id?: number
  name?: string
  email?: string
  role?: string
}

type AuthState = {
  token: string | null
  user: User | null
  roles?: any[] | null
  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  setRoles: (roles: any[] | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      roles: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setRoles: (roles) => set({ roles }),
      logout: () => set({ token: null, user: null, roles: null }),
    }),
    {
      name: 'auth-store', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Helper function to check access
export const hasAccess = (key: string): boolean => {
  const state = useAuthStore.getState()
  const { user, roles } = state
  
  if (!user) return false
  if (user.role === 'admin') return true
  
  const currentRole = roles?.find((r: any) => r.slug === user.role)
  if (!currentRole) return false
  
  // if menus is null => full access
  if (currentRole.menus === null) return true
  if (!Array.isArray(currentRole.menus)) return false
  
  return currentRole.menus.includes(key)
}