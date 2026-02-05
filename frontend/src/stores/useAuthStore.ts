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
  
  if (!user) {
    return false
  }
  if (user.role === 'admin') {
    return true
  }
  
  const currentRole = roles?.find((r: any) => r.slug === user.role)
  
  if (!currentRole) {
    return false
  }
  
  // if menus is null => full access (admin role)
  if (currentRole.menus === null) {
    return true
  }
  if (!Array.isArray(currentRole.menus)) {
    return false
  }
  
  // Check for exact match first
  if (currentRole.menus.includes(key)) {
    return true
  }
  
  const parts = key.split('.')
  const isSpecificPermission = parts.length >= 3 && ['view', 'create', 'edit', 'update', 'delete'].includes(parts[parts.length - 1])
  
  if (isSpecificPermission) {
    // For specific permissions like "kesantrian.santri.edit"
    // HANYA berikan akses jika ada exact permission atau base permission 
    // TETAPI jangan berikan edit/delete jika user hanya punya view
    const basePerm = parts.slice(0, -1).join('.')
    const requestedAction = parts[parts.length - 1]
    
    // Jika meminta akses edit/delete, pastikan user punya permission tersebut
    if (['edit', 'update', 'delete', 'create'].includes(requestedAction)) {
      // Cek apakah user hanya punya .view untuk module ini
      const hasOnlyView = currentRole.menus.includes(`${basePerm}.view`) && 
                         !currentRole.menus.some((menu: string) => 
                           menu.startsWith(basePerm) && 
                           ['edit', 'update', 'delete', 'create'].includes(menu.split('.').pop()!)
                         )
      
      if (hasOnlyView) {
        return false
      }
    }
    
    // Cek base permission
    if (currentRole.menus.includes(basePerm)) {
      return true
    }
  } else {
    // For base permissions like "kesantrian.santri", allow if user has ANY permission for that module
    const matchingPerms = currentRole.menus.filter((menu: string) => menu.startsWith(key + '.'))
    if (matchingPerms.length > 0) {
      return true
    }
  }
  
  return false
}