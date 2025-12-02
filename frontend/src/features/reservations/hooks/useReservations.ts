import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  reservationsApi,
  reservationsAdminApi,
  availabilityApi,
} from "@/api/reservations.api";
import { useAuthStore } from "@/stores/auth.store";
import type { ReservationFilters, CreateReservationInput } from "@/types";
import toast from "react-hot-toast";

/**
 * Get my reservations list
 */
export function useMyReservations(
  filters: ReservationFilters = {},
  page = 1,
  limit = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: ["my-reservations", filters, page, limit],
    queryFn: async () => {
      const response = await reservationsApi.listMy(filters, page, limit);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response.data as any;
      return {
        ...data,
        pagination: data.meta?.pagination || data.pagination,
      };
    },
    enabled,
  });
}

/**
 * Get my reservation detail
 */
export function useMyReservation(id: string, enabled = true) {
  return useQuery({
    queryKey: ["my-reservation", id],
    queryFn: async () => {
      const response = await reservationsApi.getMy(id);
      return response.data.data;
    },
    enabled: !!id && enabled,
  });
}

/**
 * Get QR code for my reservation
 */
export function useMyReservationQR(id: string, enabled = true) {
  return useQuery({
    queryKey: ["my-reservation-qr", id],
    queryFn: async () => {
      const response = await reservationsApi.getMyQR(id);
      return response.data.data;
    },
    enabled: !!id && enabled,
  });
}

/**
 * Create a new reservation (mutation)
 */
export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReservationInput) => {
      const response = await reservationsApi.create(data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["product-availability"] });
      // Rafraîchir les crédits utilisateur
      useAuthStore.getState().refreshUser();
      toast.success("Réservation créée avec succès");
    },
  });
}

/**
 * Cancel my reservation (mutation)
 */
export function useCancelMyReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await reservationsApi.cancelMy(id, reason);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservation"] });
      queryClient.invalidateQueries({ queryKey: ["product-availability"] });
      // Rafraîchir les crédits utilisateur (remboursement automatique)
      useAuthStore.getState().refreshUser();
      toast.success("Réservation annulée");
    },
  });
}

/**
 * Get product availability for a month
 */
export function useProductAvailability(
  productId: string,
  month: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ["product-availability", productId, month],
    queryFn: async () => {
      const response = await availabilityApi.getMonthly(productId, month);
      return response.data.data;
    },
    enabled: !!productId && !!month && enabled,
  });
}

/**
 * Check if dates are available (mutation for on-demand checking)
 */
export function useCheckAvailability() {
  return useMutation({
    mutationFn: async ({
      productId,
      startDate,
      endDate,
    }: {
      productId: string;
      startDate: string;
      endDate: string;
    }) => {
      const response = await availabilityApi.check(
        productId,
        startDate,
        endDate,
      );
      return response.data.data;
    },
  });
}

/**
 * ADMIN: Get all reservations
 */
export function useAdminReservations(
  filters: ReservationFilters = {},
  page = 1,
  limit = 20,
  enabled = true,
) {
  return useQuery({
    queryKey: ["admin-reservations", filters, page, limit],
    queryFn: async () => {
      const response = await reservationsAdminApi.listAll(filters, page, limit);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = response.data as any;
      return {
        ...data,
        pagination: data.meta?.pagination || data.pagination,
      };
    },
    enabled,
  });
}

/**
 * ADMIN: Get reservation detail
 */
export function useAdminReservation(id: string, enabled = true) {
  return useQuery({
    queryKey: ["admin-reservation", id],
    queryFn: async () => {
      const response = await reservationsAdminApi.get(id);
      return response.data.data;
    },
    enabled: !!id && enabled,
  });
}

/**
 * ADMIN: Checkout reservation (mutation)
 */
export function useCheckoutReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await reservationsAdminApi.checkout(id, notes);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservation"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["product-availability"] });
      toast.success("Produit retiré avec succès");
    },
  });
}

/**
 * ADMIN: Return reservation (mutation)
 */
export function useReturnReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        condition?:
          | "OK"
          | "MINOR_DAMAGE"
          | "MAJOR_DAMAGE"
          | "MISSING_PARTS"
          | "BROKEN";
        notes?: string;
        photos?: Array<{
          s3Key: string;
          filename: string;
          mimeType: string;
          size: number;
        }>;
      };
    }) => {
      const response = await reservationsAdminApi.return(id, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservation"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["product-availability"] });
      toast.success("Produit retourné avec succès");
    },
  });
}

/**
 * ADMIN: Cancel reservation (mutation)
 */
export function useCancelReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await reservationsAdminApi.cancel(id, reason);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservation"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["product-availability"] });
      // Rafraîchir les crédits utilisateur (remboursement automatique)
      useAuthStore.getState().refreshUser();
      toast.success("Réservation annulée");
    },
  });
}

/**
 * ADMIN: Refund reservation (mutation)
 */
export function useRefundReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      amount,
      reason,
    }: {
      id: string;
      amount?: number;
      reason?: string;
    }) => {
      const response = await reservationsAdminApi.refund(id, amount, reason);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservation"] });
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      // Rafraîchir les crédits utilisateur
      useAuthStore.getState().refreshUser();
      toast.success("Réservation remboursée");
    },
  });
}
