import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useAuthStore = create(persist((set) => ({
    token: null,
    user: null,
    setToken: (token) => set({ token }),
    setUser: (user) => set({ user }),
    setRoles: (roles) => set({ roles }),
    logout: () => set({ token: null, user: null }),
}), {
    name: 'auth-store', // localStorage key
}));
