import { create } from 'zustand';
export const useUIStore = create((set, get) => ({
    sidebarOpen: true,
    toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
    theme: 'light',
    setTheme: (t) => set({ theme: t }),
}));
