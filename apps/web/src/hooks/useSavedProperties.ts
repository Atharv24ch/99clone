"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { propertiesService } from "@/services/properties";
import { useAuthStore } from "@/store/authStore";

/**
 * Saved-listing ids for the signed-in user, plus a toggle that updates
 * optimistically. Signed-out users are sent to login.
 */
export function useSavedProperties() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ["saved-ids", token],
    queryFn: () => propertiesService.savedIds(token!),
    enabled: !!token,
    staleTime: 60_000,
  });

  const savedIds = new Set(data?.data ?? []);

  const mutation = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) =>
      saved ? propertiesService.unsave(id, token!) : propertiesService.save(id, token!),
    onMutate: async ({ id, saved }) => {
      await queryClient.cancelQueries({ queryKey: ["saved-ids", token] });
      const prev = queryClient.getQueryData<{ data: string[] }>(["saved-ids", token]);
      queryClient.setQueryData<{ data: string[] }>(["saved-ids", token], (old) => {
        const ids = new Set(old?.data ?? []);
        if (saved) ids.delete(id);
        else ids.add(id);
        return { data: [...ids] };
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["saved-ids", token], ctx.prev);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-ids", token] });
      void queryClient.invalidateQueries({ queryKey: ["saved-list"] });
    },
  });

  const toggle = (id: string) => {
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    mutation.mutate({ id, saved: savedIds.has(id) });
  };

  return { savedIds, toggle, isSaved: (id: string) => savedIds.has(id) };
}
