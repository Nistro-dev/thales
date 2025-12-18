import { apiClient } from "./client";
import type { ApiResponse } from "@/types";

export type LegalPageType = "TERMS" | "PRIVACY" | "LEGAL_NOTICE";

export interface LegalPage {
  id: string;
  type: LegalPageType;
  title: string;
  content: string;
  version: string;
  updatedBy: string | null;
  editor?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface UpdateLegalPageRequest {
  title: string;
  content: string;
  version?: string;
}

export const legalApi = {
  // Get a legal page by type (public)
  getPage: async (type: LegalPageType) => {
    const response = await apiClient.get<ApiResponse<LegalPage>>(
      `/legal/${type}`,
    );
    return response.data.data;
  },

  // Get all legal pages (admin)
  getAllPages: async () => {
    const response =
      await apiClient.get<ApiResponse<{ pages: LegalPage[] }>>("/admin/legal");
    return response.data.data?.pages ?? [];
  },

  // Update a legal page (admin)
  updatePage: async (type: LegalPageType, data: UpdateLegalPageRequest) => {
    const response = await apiClient.put<ApiResponse<LegalPage>>(
      `/admin/legal/${type}`,
      data,
    );
    return response.data.data;
  },
};

// Helper to get display name for page type
export function getLegalPageTypeName(type: LegalPageType): string {
  switch (type) {
    case "TERMS":
      return "Conditions Générales d'Utilisation";
    case "PRIVACY":
      return "Politique de Confidentialité";
    case "LEGAL_NOTICE":
      return "Mentions Légales";
    default:
      return type;
  }
}

// Helper to get short name for page type
export function getLegalPageTypeShortName(type: LegalPageType): string {
  switch (type) {
    case "TERMS":
      return "CGU";
    case "PRIVACY":
      return "RGPD";
    case "LEGAL_NOTICE":
      return "Mentions";
    default:
      return type;
  }
}
