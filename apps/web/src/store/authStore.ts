import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import type { User } from "@/types/user";

interface AuthStoreState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,

        setAuth: (user, token) =>
          set({ user, token, isAuthenticated: true, isLoading: false }),

        clearAuth: () =>
          set({ user: null, token: null, isAuthenticated: false }),

        setLoading: (loading) => set({ isLoading: loading }),

        updateUser: (partial) =>
          set((state) =>
            state.user ? { user: { ...state.user, ...partial } } : {}
          ),
      }),
      {
        name: "acres99-auth",
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);
