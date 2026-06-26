import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, UserRole } from "@/types";
interface AuthStore {
  auth: AuthState | null;
  setAuth: (a: AuthState) => void;
  clearAuth: () => void;
  updateRole: (r: UserRole) => void;
  isAuthenticated: () => boolean;
}
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      auth: null,
      setAuth: (auth) => set({ auth }),
      clearAuth: () => set({ auth: null }),
      updateRole: (role) =>
        set((s) => ({
          auth: s.auth ? { ...s.auth, user: { ...s.auth.user, role } } : null,
        })),
      isAuthenticated: () => !!get().auth?.token,
    }),
    { name: "automiq" },
  ),
);
