import { apiClient } from "./client";
import type { ApiResponse } from "@/types";

// ============================================
// TYPES
// ============================================

export interface MaintenanceUser {
  firstName: string;
  lastName: string;
}

export interface ProductMaintenance {
  id: string;
  productId: string;
  startDate: string;
  endDate: string | null;
  reason: string | null;
  cancelledReservationsCount: number;
  refundedCreditsTotal: number;
  createdBy: string;
  createdByUser: MaintenanceUser | null;
  endedAt: string | null;
  endedBy: string | null;
  endedByUser: MaintenanceUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceInput {
  startDate: string;
  endDate?: string | null;
  reason?: string | null;
}

export interface UpdateMaintenanceInput {
  endDate?: string | null;
  reason?: string | null;
}

export interface MaintenancePreview {
  hasOverlap: boolean;
  overlappingMaintenance?: ProductMaintenance;
  affectedReservations: Array<{
    id: string;
    startDate: string;
    endDate: string;
    creditsCharged: number;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
  totalReservationsAffected: number;
  totalCreditsToRefund: number;
}

export interface MaintenanceStatus {
  active: ProductMaintenance | null;
  scheduled: ProductMaintenance[];
}

export interface CreateMaintenanceResponse {
  maintenance: ProductMaintenance;
  cancelledReservationsCount: number;
  refundedCreditsTotal: number;
}

// ============================================
// API
// ============================================

export const maintenanceApi = {
  /**
   * Preview affected reservations before creating maintenance
   */
  preview: (productId: string, data: CreateMaintenanceInput) => {
    return apiClient.post<ApiResponse<MaintenancePreview>>(
      `/products/${productId}/maintenance/preview`,
      data,
    );
  },

  /**
   * Get active and scheduled maintenances for a product
   */
  getStatus: (productId: string) => {
    return apiClient.get<ApiResponse<MaintenanceStatus>>(
      `/products/${productId}/maintenance/active`,
    );
  },

  /**
   * Create a new maintenance
   */
  create: (productId: string, data: CreateMaintenanceInput) => {
    return apiClient.post<ApiResponse<CreateMaintenanceResponse>>(
      `/products/${productId}/maintenance`,
      data,
    );
  },

  /**
   * Get all maintenances for a product (history)
   */
  list: (productId: string) => {
    return apiClient.get<ApiResponse<ProductMaintenance[]>>(
      `/products/${productId}/maintenance`,
    );
  },

  /**
   * Get a specific maintenance
   */
  get: (productId: string, maintenanceId: string) => {
    return apiClient.get<ApiResponse<ProductMaintenance>>(
      `/products/${productId}/maintenance/${maintenanceId}`,
    );
  },

  /**
   * Update a maintenance
   */
  update: (
    productId: string,
    maintenanceId: string,
    data: UpdateMaintenanceInput,
  ) => {
    return apiClient.patch<ApiResponse<ProductMaintenance>>(
      `/products/${productId}/maintenance/${maintenanceId}`,
      data,
    );
  },

  /**
   * End a maintenance early
   */
  end: (productId: string, maintenanceId: string) => {
    return apiClient.post<ApiResponse<ProductMaintenance>>(
      `/products/${productId}/maintenance/${maintenanceId}/end`,
      {},
    );
  },

  /**
   * Cancel a scheduled maintenance (before it starts)
   */
  cancel: (productId: string, maintenanceId: string) => {
    return apiClient.delete<ApiResponse<void>>(
      `/products/${productId}/maintenance/${maintenanceId}`,
    );
  },
};
