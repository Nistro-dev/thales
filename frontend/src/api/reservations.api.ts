import { apiClient } from "./client";
import type {
  Reservation,
  CreateReservationInput,
  ReservationFilters,
} from "@/types";
import type { ApiResponse, PaginatedResponse } from "@/types";

/**
 * Build query string from filters
 */
const buildQueryString = (
  filters: ReservationFilters & { page?: number; limit?: number },
): string => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.status) params.append("status", filters.status);
  if (filters.userId) params.append("userId", filters.userId);
  if (filters.productId) params.append("productId", filters.productId);
  if (filters.startDateFrom)
    params.append("startDateFrom", filters.startDateFrom);
  if (filters.startDateTo) params.append("startDateTo", filters.startDateTo);
  if (filters.overdue) params.append("overdue", filters.overdue);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);

  const query = params.toString();
  return query ? `?${query}` : "";
};

/**
 * User Reservations API
 */
export const reservationsApi = {
  /**
   * Get my reservations list
   */
  listMy: (filters: ReservationFilters = {}, page = 1, limit = 20) => {
    const query = buildQueryString({ ...filters, page, limit });
    return apiClient.get<PaginatedResponse<Reservation>>(
      `/reservations${query}`,
    );
  },

  /**
   * Get my reservation detail
   */
  getMy: (id: string) => {
    return apiClient.get<ApiResponse<Reservation>>(`/reservations/${id}`);
  },

  /**
   * Get QR code for my reservation
   */
  getMyQR: (id: string) => {
    return apiClient.get<ApiResponse<{ qrCode: string }>>(
      `/reservations/${id}/qr`,
    );
  },

  /**
   * Create a new reservation
   */
  create: (data: CreateReservationInput) => {
    return apiClient.post<ApiResponse<Reservation>>("/reservations", data);
  },

  /**
   * Cancel my reservation
   */
  cancelMy: (id: string, reason?: string) => {
    return apiClient.post<ApiResponse<Reservation>>(
      `/reservations/${id}/cancel`,
      {
        reason,
      },
    );
  },
};

/**
 * Admin Reservations API
 */
export const reservationsAdminApi = {
  /**
   * Get all reservations (admin)
   */
  listAll: (filters: ReservationFilters = {}, page = 1, limit = 20) => {
    const query = buildQueryString({ ...filters, page, limit });
    return apiClient.get<PaginatedResponse<Reservation>>(
      `/admin/reservations${query}`,
    );
  },

  /**
   * Get reservation detail (admin)
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<Reservation>>(`/admin/reservations/${id}`);
  },

  /**
   * Create reservation for a user (admin)
   */
  createForUser: (
    data: CreateReservationInput & {
      userId: string;
      adminNotes?: string;
      status?: "CONFIRMED" | "CHECKED_OUT" | "RETURNED";
    },
  ) => {
    return apiClient.post<ApiResponse<Reservation>>(
      "/admin/reservations",
      data,
    );
  },

  /**
   * Update reservation (admin)
   */
  update: (
    id: string,
    data: {
      startDate?: string;
      endDate?: string;
      notes?: string;
      adminNotes?: string;
    },
  ) => {
    return apiClient.patch<ApiResponse<Reservation>>(
      `/admin/reservations/${id}`,
      data,
    );
  },

  /**
   * Cancel reservation (admin)
   */
  cancel: (id: string, reason?: string) => {
    return apiClient.post<ApiResponse<Reservation>>(
      `/admin/reservations/${id}/cancel`,
      {
        reason,
      },
    );
  },

  /**
   * Refund reservation (admin)
   */
  refund: (id: string, amount?: number, reason?: string) => {
    return apiClient.post<ApiResponse<Reservation>>(
      `/admin/reservations/${id}/refund`,
      {
        amount,
        reason,
      },
    );
  },

  /**
   * Penalize reservation (admin)
   */
  penalize: (id: string, amount: number, reason: string) => {
    return apiClient.post<
      ApiResponse<Reservation & { willBeNegative: boolean; newBalance: number }>
    >(`/admin/reservations/${id}/penalty`, {
      amount,
      reason,
    });
  },

  /**
   * Checkout reservation (admin)
   */
  checkout: (id: string, notes?: string) => {
    return apiClient.post<ApiResponse<Reservation>>(
      `/admin/reservations/${id}/checkout`,
      {
        notes,
      },
    );
  },

  /**
   * Return reservation (admin)
   */
  return: (
    id: string,
    data: {
      condition?:
        | "OK"
        | "MINOR_DAMAGE"
        | "MAJOR_DAMAGE"
        | "MISSING_PARTS"
        | "BROKEN";
      notes?: string;
      photos?: Array<{ file: File; caption?: string }>;
    },
  ) => {
    // Use FormData if there are photos
    if (data.photos && data.photos.length > 0) {
      const formData = new FormData();
      if (data.condition) formData.append("condition", data.condition);
      if (data.notes) formData.append("notes", data.notes);

      data.photos.forEach((photo, index) => {
        formData.append("photos", photo.file);
        if (photo.caption) {
          formData.append(`caption_${index}`, photo.caption);
        }
      });

      return apiClient.post<ApiResponse<Reservation>>(
        `/admin/reservations/${id}/return`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
    }

    // No photos, use JSON
    return apiClient.post<ApiResponse<Reservation>>(
      `/admin/reservations/${id}/return`,
      {
        condition: data.condition,
        notes: data.notes,
      },
    );
  },
};

/**
 * Product Availability API
 */
export const availabilityApi = {
  /**
   * Get monthly availability calendar for a product
   */
  getMonthly: (productId: string, month: string) => {
    return apiClient.get<
      ApiResponse<{
        productId: string;
        month: string;
        allowedDaysIn: number[];
        allowedDaysOut: number[];
        reservedDates: Array<{ date: string }>;
      }>
    >(`/products/${productId}/availability?month=${month}`);
  },

  /**
   * Check if specific dates are available
   */
  check: (productId: string, startDate: string, endDate: string) => {
    return apiClient.get<ApiResponse<{ available: boolean; reason?: string }>>(
      `/products/${productId}/check-availability?startDate=${startDate}&endDate=${endDate}`,
    );
  },
};

/**
 * QR Scan API (Admin)
 */
export const scanApi = {
  /**
   * Scan QR code to get reservation info
   */
  scan: (qrCode: string) => {
    return apiClient.get<
      ApiResponse<{ type: string; reservation: Reservation }>
    >(`/scan/${qrCode}`);
  },

  /**
   * Checkout via QR scan
   */
  checkout: (qrCode: string, notes?: string) => {
    return apiClient.post<ApiResponse<Reservation>>(
      `/scan/${qrCode}/checkout`,
      { notes },
    );
  },

  /**
   * Return via QR scan
   */
  return: (
    qrCode: string,
    data: {
      condition?:
        | "OK"
        | "MINOR_DAMAGE"
        | "MAJOR_DAMAGE"
        | "MISSING_PARTS"
        | "BROKEN";
      notes?: string;
      photos?: Array<{ file: File; caption?: string }>;
    },
  ) => {
    // Use FormData if there are photos
    if (data.photos && data.photos.length > 0) {
      const formData = new FormData();
      if (data.condition) formData.append("condition", data.condition);
      if (data.notes) formData.append("notes", data.notes);

      data.photos.forEach((photo, index) => {
        formData.append("photos", photo.file);
        if (photo.caption) {
          formData.append(`caption_${index}`, photo.caption);
        }
      });

      return apiClient.post<ApiResponse<Reservation>>(
        `/scan/${qrCode}/return`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
    }

    // No photos, use JSON
    return apiClient.post<ApiResponse<Reservation>>(`/scan/${qrCode}/return`, {
      condition: data.condition,
      notes: data.notes,
    });
  },
};
