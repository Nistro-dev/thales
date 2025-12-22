import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  maintenanceApi,
  type CreateMaintenanceInput,
  type UpdateMaintenanceInput,
} from "@/api/maintenance.api";
import { productKeys } from "./useProductsAdmin";

// ============================================
// QUERY KEYS
// ============================================

export const maintenanceKeys = {
  all: ["maintenance"] as const,
  product: (productId: string) =>
    [...maintenanceKeys.all, "product", productId] as const,
  status: (productId: string) =>
    [...maintenanceKeys.product(productId), "status"] as const,
  list: (productId: string) =>
    [...maintenanceKeys.product(productId), "list"] as const,
  detail: (productId: string, maintenanceId: string) =>
    [...maintenanceKeys.product(productId), "detail", maintenanceId] as const,
};

// ============================================
// GET MAINTENANCE STATUS (Active + Scheduled)
// ============================================

export function useMaintenanceStatus(productId: string | undefined) {
  return useQuery({
    queryKey: maintenanceKeys.status(productId!),
    queryFn: async () => {
      const response = await maintenanceApi.getStatus(productId!);
      return response.data.data;
    },
    enabled: !!productId,
  });
}

// ============================================
// GET MAINTENANCE HISTORY
// ============================================

export function useMaintenanceHistory(productId: string | undefined) {
  return useQuery({
    queryKey: maintenanceKeys.list(productId!),
    queryFn: async () => {
      const response = await maintenanceApi.list(productId!);
      return response.data.data ?? [];
    },
    enabled: !!productId,
  });
}

// ============================================
// GET SINGLE MAINTENANCE
// ============================================

export function useMaintenance(
  productId: string | undefined,
  maintenanceId: string | undefined,
) {
  return useQuery({
    queryKey: maintenanceKeys.detail(productId!, maintenanceId!),
    queryFn: async () => {
      const response = await maintenanceApi.get(productId!, maintenanceId!);
      return response.data.data;
    },
    enabled: !!productId && !!maintenanceId,
  });
}

// ============================================
// PREVIEW MAINTENANCE
// ============================================

export function usePreviewMaintenance() {
  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: CreateMaintenanceInput;
    }) => maintenanceApi.preview(productId, data),
    onError: () => {
      toast.error("Erreur lors de la prévisualisation");
    },
  });
}

// ============================================
// CREATE MAINTENANCE
// ============================================

export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      data,
    }: {
      productId: string;
      data: CreateMaintenanceInput;
    }) => maintenanceApi.create(productId, data),
    onSuccess: (response, { productId }) => {
      const result = response.data.data;
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.product(productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });

      if (result && result.cancelledReservationsCount > 0) {
        toast.success(
          `Maintenance créée. ${result.cancelledReservationsCount} réservation(s) annulée(s) et ${result.refundedCreditsTotal} crédits remboursés.`,
        );
      } else {
        toast.success("Maintenance créée avec succès");
      }
    },
    onError: () => {
      toast.error("Erreur lors de la création de la maintenance");
    },
  });
}

// ============================================
// UPDATE MAINTENANCE
// ============================================

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      maintenanceId,
      data,
    }: {
      productId: string;
      maintenanceId: string;
      data: UpdateMaintenanceInput;
    }) => maintenanceApi.update(productId, maintenanceId, data),
    onSuccess: (_, { productId, maintenanceId }) => {
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.product(productId),
      });
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.detail(productId, maintenanceId),
      });
      toast.success("Maintenance mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de la maintenance");
    },
  });
}

// ============================================
// END MAINTENANCE (Early termination)
// ============================================

export function useEndMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      maintenanceId,
    }: {
      productId: string;
      maintenanceId: string;
    }) => maintenanceApi.end(productId, maintenanceId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.product(productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      toast.success(
        "Maintenance terminée. Le produit est de nouveau disponible.",
      );
    },
    onError: () => {
      toast.error("Erreur lors de la fin de la maintenance");
    },
  });
}

// ============================================
// CANCEL MAINTENANCE (Before it starts)
// ============================================

export function useCancelMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      maintenanceId,
    }: {
      productId: string;
      maintenanceId: string;
    }) => maintenanceApi.cancel(productId, maintenanceId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: maintenanceKeys.product(productId),
      });
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Maintenance programmée annulée");
    },
    onError: () => {
      toast.error("Erreur lors de l'annulation de la maintenance");
    },
  });
}
