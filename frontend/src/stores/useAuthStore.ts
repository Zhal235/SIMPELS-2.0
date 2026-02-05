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
  
  // DEBUG: Only log in development
  const isDev = import.meta.env.DEV
  
  if (isDev) {
    console.log('=== PERMISSION DEBUG ===')
    console.log('User:', user)
    console.log('Roles:', roles)
    console.log('Checking permission:', key)
  }
  
  if (!user) {
    if (isDev) console.log('❌ No user found')
    return false
  }
  if (user.role === 'admin') {
    if (isDev) console.log('✅ Admin access granted')
    return true
  }
  
  const currentRole = roles?.find((r: any) => r.slug === user.role)
  if (isDev) console.log('Current role found:', currentRole)
  
  if (!currentRole) {
    if (isDev) console.log('❌ Role not found for:', user.role)
    return false
  }
  
  // if menus is null => full access (admin role)
  if (currentRole.menus === null) {
    if (isDev) console.log('✅ Full access (menus is null)')
    return true
  }
  if (!Array.isArray(currentRole.menus)) {
    if (isDev) console.log('❌ Menus is not array:', currentRole.menus)
    return false
  }
  
  if (isDev) console.log('Available menus:', currentRole.menus)
  
  // Check for exact match first
  if (currentRole.menus.includes(key)) {
    if (isDev) console.log('✅ Exact match found')
    return true
  }
  
  const parts = key.split('.')
  const isSpecificPermission = parts.length >= 3 && ['view', 'create', 'edit', 'update', 'delete'].includes(parts[parts.length - 1])
  
  if (isDev) console.log('Is specific permission:', isSpecificPermission, 'Parts:', parts)
  
  if (isSpecificPermission) {
    // For specific permissions like "kesantrian.santri.edit"
    // HANYA berikan akses jika ada exact permission atau base permission 
    // TETAPI jangan berikan edit/delete jika user hanya punya view
    const basePerm = parts.slice(0, -1).join('.')
    const requestedAction = parts[parts.length - 1]
    
    if (isDev) console.log('Checking base permission:', basePerm, 'Action:', requestedAction)
    
    // Jika meminta akses edit/delete, pastikan user punya permission tersebut
    if (['edit', 'update', 'delete', 'create'].includes(requestedAction)) {
      // Cek apakah user hanya punya .view untuk module ini
      const hasOnlyView = currentRole.menus.includes(`${basePerm}.view`) && 
                         !currentRole.menus.some((menu: string) => 
                           menu.startsWith(basePerm) && 
                           ['edit', 'update', 'delete', 'create'].includes(menu.split('.').pop()!)
                         )
      
      if (hasOnlyView) {
        if (isDev) console.log('❌ User only has view permission, denying', requestedAction)
        return false
      }
    }
    
    // Cek base permission
    if (currentRole.menus.includes(basePerm)) {
      if (isDev) console.log('✅ Base permission found')
      return true
    }
  } else {
    // For base permissions like "kesantrian.santri", allow if user has ANY permission for that module
    const matchingPerms = currentRole.menus.filter((menu: string) => menu.startsWith(key + '.'))
    if (isDev) console.log('Matching permissions:', matchingPerms)
    if (matchingPerms.length > 0) {
      if (isDev) console.log('✅ Module access found')
      return true
    }
  }
  
  if (isDev) {
    console.log('❌ Access denied')
    console.log('=== END DEBUG ===')
  }
  return false
}