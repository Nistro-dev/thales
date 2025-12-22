import { apiClient } from "./client";
import type {
  Product,
  ProductFilters,
  ProductStatus,
  ProductFile,
  ProductCondition,
} from "@/types";
import type { ApiResponse, PaginatedResponse } from "@/types";

// ============================================
// TYPES
// ============================================

export type CreditPeriod = "DAY" | "WEEK";

export interface CreateProductInput {
  name: string;
  description?: string;
  reference?: string;
  priceCredits: number;
  creditPeriod?: CreditPeriod;
  minDuration?: number;
  maxDuration?: number;
  sectionId: string;
  subSectionId?: string;
  attributes?: Array<{ key: string; value: string }>;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  reference?: string;
  priceCredits?: number;
  creditPeriod?: CreditPeriod;
  minDuration?: number;
  maxDuration?: number;
  sectionId?: string;
  subSectionId?: string | null;
  attributes?: Array<{ key: string; value: string }>;
}

export interface ProductMovement {
  id: string;
  productId: string;
  reservationId: string | null;
  type: "CHECKOUT" | "RETURN" | "STATUS_CHANGE";
  condition: ProductCondition | null;
  notes: string | null;
  performedBy: string;
  performedAt: string;
  product?: {
    id: string;
    name: string;
    reference: string | null;
  };
  reservation?: {
    id: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  } | null;
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  photos?: Array<{
    id: string;
    s3Key: string;
    filename: string;
    mimeType: string;
    size: number;
    sortOrder: number;
    url?: string;
  }>;
}

export interface AddAttributeInput {
  key: string;
  value: string;
}

export interface UpdateAttributeInput {
  value: string;
}

export interface ReorderFilesInput {
  fileIds: string[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const buildQueryString = (
  filters: ProductFilters & { page?: number; limit?: number },
): string => {
  const params = new URLSearchParams();

  if (filters.page) params.append("page", filters.page.toString());
  if (filters.limit) params.append("limit", filters.limit.toString());
  if (filters.search) params.append("search", filters.search);
  if (filters.sectionId) params.append("sectionId", filters.sectionId);
  if (filters.subSectionId) params.append("subSectionId", filters.subSectionId);
  if (filters.status) params.append("status", filters.status);
  if (filters.minPrice !== undefined)
    params.append("minPrice", filters.minPrice.toString());
  if (filters.maxPrice !== undefined)
    params.append("maxPrice", filters.maxPrice.toString());
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters.includeArchived) params.append("includeArchived", "true");

  const query = params.toString();
  return query ? `?${query}` : "";
};

// ============================================
// PRODUCTS API (PUBLIC)
// ============================================

export const productsApi = {
  /**
   * Get products list with filters and pagination
   */
  list: (filters: ProductFilters = {}, page = 1, limit = 20) => {
    const query = buildQueryString({ ...filters, page, limit });
    return apiClient.get<PaginatedResponse<Product>>(`/products${query}`);
  },

  /**
   * Get product detail (public view)
   */
  get: (id: string) => {
    return apiClient.get<ApiResponse<Product>>(`/products/${id}`);
  },

  /**
   * Get product detail with admin data (requires MANAGE_PRODUCTS permission)
   */
  getAdmin: (id: string) => {
    return apiClient.get<ApiResponse<Product>>(`/products/${id}/admin`);
  },

  /**
   * Get product files (public only)
   */
  getFiles: (id: string) => {
    return apiClient.get<ApiResponse<Product["files"]>>(
      `/products/${id}/files`,
    );
  },

  /**
   * Get product files including admin-only files (requires MANAGE_PRODUCTS permission)
   */
  getFilesAdmin: (id: string) => {
    return apiClient.get<ApiResponse<Product["files"]>>(
      `/products/${id}/files/admin`,
    );
  },

  /**
   * Get product movements history
   */
  getMovements: (id: string) => {
    return apiClient.get<ApiResponse<ProductMovement[]>>(
      `/products/${id}/movements`,
    );
  },
};

// ============================================
// ADMIN PRODUCTS API
// ============================================

export const adminProductsApi = {
  /**
   * Create a new product
   */
  create: (data: CreateProductInput) => {
    return apiClient.post<ApiResponse<Product>>("/products", data);
  },

  /**
   * Update a product
   */
  update: (id: string, data: UpdateProductInput) => {
    return apiClient.patch<ApiResponse<Product>>(`/products/${id}`, data);
  },

  /**
   * Update product status
   */
  updateStatus: (id: string, status: ProductStatus) => {
    return apiClient.patch<ApiResponse<Product>>(`/products/${id}/status`, {
      status,
    });
  },

  /**
   * Delete (archive) a product
   */
  delete: (id: string) => {
    return apiClient.delete<ApiResponse<void>>(`/products/${id}`);
  },

  // ============================================
  // ATTRIBUTES
  // ============================================

  /**
   * Add an attribute to a product
   */
  addAttribute: (productId: string, data: AddAttributeInput) => {
    return apiClient.post<
      ApiResponse<{ id: string; key: string; value: string }>
    >(`/products/${productId}/attributes`, data);
  },

  /**
   * Update a product attribute
   */
  updateAttribute: (
    productId: string,
    key: string,
    data: UpdateAttributeInput,
  ) => {
    return apiClient.patch<
      ApiResponse<{ id: string; key: string; value: string }>
    >(`/products/${productId}/attributes/${encodeURIComponent(key)}`, data);
  },

  /**
   * Delete a product attribute
   */
  deleteAttribute: (productId: string, key: string) => {
    return apiClient.delete<ApiResponse<void>>(
      `/products/${productId}/attributes/${encodeURIComponent(key)}`,
    );
  },

  // ============================================
  // FILES
  // ============================================

  /**
   * Upload a file to a product
   */
  uploadFile: (productId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<ApiResponse<ProductFile>>(
      `/products/${productId}/files`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  /**
   * Delete a product file
   */
  deleteFile: (productId: string, fileId: string) => {
    return apiClient.delete<ApiResponse<void>>(
      `/products/${productId}/files/${fileId}`,
    );
  },

  /**
   * Reorder product files
   */
  reorderFiles: (productId: string, data: ReorderFilesInput) => {
    return apiClient.patch<ApiResponse<void>>(
      `/products/${productId}/files/reorder`,
      data,
    );
  },

  /**
   * Update file visibility
   */
  updateFileVisibility: (
    productId: string,
    fileId: string,
    visibility: "PUBLIC" | "ADMIN",
  ) => {
    return apiClient.patch<ApiResponse<ProductFile>>(
      `/products/${productId}/files/${fileId}/visibility`,
      { visibility },
    );
  },

  /**
   * Rename a product file
   */
  renameFile: (productId: string, fileId: string, filename: string) => {
    return apiClient.patch<ApiResponse<ProductFile>>(
      `/products/${productId}/files/${fileId}/rename`,
      { filename },
    );
  },
};

// ============================================
// ADMIN MOVEMENTS API
// ============================================

export const adminMovementsApi = {
  /**
   * List all movements with filters
   */
  list: (
    params: {
      page?: number;
      limit?: number;
      productId?: string;
      reservationId?: string;
      type?: "CHECKOUT" | "RETURN";
      sortOrder?: "asc" | "desc";
    } = {},
  ) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", params.page.toString());
    if (params.limit) searchParams.append("limit", params.limit.toString());
    if (params.productId) searchParams.append("productId", params.productId);
    if (params.reservationId)
      searchParams.append("reservationId", params.reservationId);
    if (params.type) searchParams.append("type", params.type);
    if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const query = searchParams.toString();
    return apiClient.get<PaginatedResponse<ProductMovement>>(
      `/admin/movements${query ? `?${query}` : ""}`,
    );
  },
};
