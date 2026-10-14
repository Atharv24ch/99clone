import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { User } from "@/types/user";

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** True once persisted state has been read from localStorage. */
  hasHydrated: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (partial) =>
        set((state) => (state.user ? { user: { ...state.user, ...partial } } : {})),
    }),
    {
      name: "aangan-auth",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      // localStorage rehydrates synchronously inside create(), before
      // useAuthStore is assigned, so defer the flag by a microtask.
      onRehydrateStorage: () => () => {
        queueMicrotask(() => useAuthStore.setState({ hasHydrated: true }));
      },
    }
  )
);
