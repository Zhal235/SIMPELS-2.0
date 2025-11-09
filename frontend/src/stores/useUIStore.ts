import { create } from 'zustand'

type UIState = {
  sidebarOpen: boolean
  toggleSidebar: () => void
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: true,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  theme: 'light',
  setTheme: (t) => set({ theme: t }),
}))