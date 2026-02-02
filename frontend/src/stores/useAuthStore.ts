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
  
  // Check for exact match first
  if (currentRole.menus.includes(key)) return true
  
  // For backward compatibility: if checking a specific permission like "keuangan.transaksi-kas.edit"
  // also check for base permission "keuangan.transaksi-kas"
  const parts = key.split('.')
  if (parts.length >= 3) {
    const basePerm = parts.slice(0, -1).join('.')
    if (currentRole.menus.includes(basePerm)) return true
  }
  
  // For checking base permissions like "keuangan.transaksi-kas"
  // also allow if user has any specific permission for that base
  const matchingPerms = currentRole.menus.filter((menu: string) => menu.startsWith(key + '.'))
  if (matchingPerms.length > 0) return true
  
  return false
}