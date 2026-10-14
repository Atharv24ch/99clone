"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { onUnauthorized } from "@/services/api";
import { useAuthStore } from "@/store/authStore";

/**
 * Client-side providers. The QueryClient lives in state so it is created once
 * per page load; an expired token anywhere signs the user out.
 */
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    onUnauthorized(() => {
      useAuthStore.getState().clearAuth();
      queryClient.clear();
    });
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
