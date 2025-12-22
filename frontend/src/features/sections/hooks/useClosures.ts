import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  closuresApi,
  type CreateClosureInput,
  type UpdateClosureInput,
} from "@/api/sections.api";

// ============================================
// QUERY KEYS
// ============================================

export const closureKeys = {
  all: ["closures"] as const,
  lists: () => [...closureKeys.all, "list"] as const,
  list: (sectionId: string) => [...closureKeys.lists(), sectionId] as const,
  details: () => [...closureKeys.all, "detail"] as const,
  detail: (id: string) => [...closureKeys.details(), id] as const,
  current: (sectionId: string) =>
    [...closureKeys.all, "current", sectionId] as const,
};

// ============================================
// LIST CLOSURES
// ============================================

export function useClosures(
  sectionId: string | undefined,
  includeExpired = true,
) {
  return useQuery({
    queryKey: closureKeys.list(sectionId!),
    queryFn: async () => {
      const response = await closuresApi.list(sectionId!, includeExpired);
      return response.data.data;
    },
    enabled: !!sectionId,
  });
}

// ============================================
// GET CURRENT CLOSURE
// ============================================

export function useCurrentClosure(sectionId: string | undefined) {
  return useQuery({
    queryKey: closureKeys.current(sectionId!),
    queryFn: async () => {
      const response = await closuresApi.getCurrent(sectionId!);
      return response.data.data;
    },
    enabled: !!sectionId,
  });
}

// ============================================
// CREATE CLOSURE
// ============================================

export function useCreateClosure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: string;
      data: CreateClosureInput;
    }) => closuresApi.create(sectionId, data),
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: closureKeys.list(sectionId) });
      queryClient.invalidateQueries({
        queryKey: closureKeys.current(sectionId),
      });
      toast.success("Fermeture créée avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la création de la fermeture");
    },
  });
}

// ============================================
// UPDATE CLOSURE
// ============================================

export function useUpdateClosure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      closureId,
      data,
    }: {
      closureId: string;
      sectionId: string;
      data: UpdateClosureInput;
    }) => closuresApi.update(closureId, data),
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: closureKeys.list(sectionId) });
      queryClient.invalidateQueries({
        queryKey: closureKeys.current(sectionId),
      });
      toast.success("Fermeture mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de la fermeture");
    },
  });
}

// ============================================
// DELETE CLOSURE
// ============================================

export function useDeleteClosure() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ closureId }: { closureId: string; sectionId: string }) =>
      closuresApi.delete(closureId),
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: closureKeys.list(sectionId) });
      queryClient.invalidateQueries({
        queryKey: closureKeys.current(sectionId),
      });
      toast.success("Fermeture supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de la fermeture");
    },
  });
}
