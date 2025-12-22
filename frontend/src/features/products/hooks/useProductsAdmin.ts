import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  productsApi,
  adminProductsApi,
  productReservationsApi,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductReservationsFilters,
} from "@/api/products.api";
import type { ProductFilters, ProductStatus } from "@/types";

// ============================================
// QUERY KEYS
// ============================================

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters, page: number, limit: number) =>
    [...productKeys.lists(), { filters, page, limit }] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  adminDetail: (id: string) => [...productKeys.details(), id, "admin"] as const,
  files: (id: string) => [...productKeys.detail(id), "files"] as const,
  adminFiles: (id: string) =>
    [...productKeys.detail(id), "files", "admin"] as const,
  movements: (id: string) => [...productKeys.detail(id), "movements"] as const,
  reservations: (id: string, filters: ProductReservationsFilters) =>
    [...productKeys.detail(id), "reservations", filters] as const,
};

// ============================================
// LIST PRODUCTS (ADMIN VIEW - includes archived)
// ============================================

export function useProductsAdmin(
  filters: ProductFilters = {},
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: productKeys.list(filters, page, limit),
    queryFn: async () => {
      const response = await productsApi.list(filters, page, limit);
      return response.data;
    },
    staleTime: 30 * 1000,
  });
}

// ============================================
// GET PRODUCT DETAIL (ADMIN)
// ============================================

export function useProductAdmin(id: string | undefined) {
  return useQuery({
    queryKey: productKeys.adminDetail(id!),
    queryFn: async () => {
      const response = await productsApi.getAdmin(id!);
      return response.data.data;
    },
    enabled: !!id,
  });
}

// ============================================
// GET PRODUCT FILES (ADMIN - includes hidden files)
// ============================================

export function useProductFilesAdmin(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.adminFiles(productId!),
    queryFn: async () => {
      const response = await productsApi.getFilesAdmin(productId!);
      return response.data.data ?? [];
    },
    enabled: !!productId,
  });
}

// ============================================
// GET PRODUCT MOVEMENTS
// ============================================

export function useProductMovements(productId: string | undefined) {
  return useQuery({
    queryKey: productKeys.movements(productId!),
    queryFn: async () => {
      const response = await productsApi.getMovements(productId!);
      return response.data.data ?? [];
    },
    enabled: !!productId,
  });
}

// ============================================
// CREATE PRODUCT
// ============================================

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductInput) => adminProductsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Produit créé avec succès");
    },
    onError: () => {
      toast.error("Erreur lors de la création du produit");
    },
  });
}

// ============================================
// UPDATE PRODUCT
// ============================================

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductInput }) =>
      adminProductsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.adminDetail(id) });
      toast.success("Produit mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du produit");
    },
  });
}

// ============================================
// UPDATE PRODUCT STATUS
// ============================================

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      adminProductsApi.updateStatus(id, status),
    onSuccess: (_, { id, status }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: productKeys.adminDetail(id) });
      const messages: Record<ProductStatus, string> = {
        AVAILABLE: "Produit disponible",
        UNAVAILABLE: "Produit indisponible",
        MAINTENANCE: "Produit en maintenance",
        ARCHIVED: "Produit archivé",
      };
      toast.success(messages[status]);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du statut");
    },
  });
}

// ============================================
// DELETE (ARCHIVE) PRODUCT
// ============================================

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminProductsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success("Produit archivé");
    },
    onError: () => {
      toast.error("Erreur lors de l'archivage du produit");
    },
  });
}

// ============================================
// FILE MANAGEMENT
// ============================================

export function useUploadProductFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) =>
      adminProductsApi.uploadFile(productId, file),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.files(productId) });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminFiles(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      toast.success("Fichier uploadé");
    },
    onError: () => {
      toast.error("Erreur lors de l'upload du fichier");
    },
  });
}

export function useDeleteProductFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      fileId,
    }: {
      productId: string;
      fileId: string;
    }) => adminProductsApi.deleteFile(productId, fileId),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.files(productId) });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminFiles(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      toast.success("Fichier supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du fichier");
    },
  });
}

export function useReorderProductFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      fileIds,
    }: {
      productId: string;
      fileIds: string[];
    }) => adminProductsApi.reorderFiles(productId, { fileIds }),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.files(productId) });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminFiles(productId),
      });
      toast.success("Ordre des fichiers mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la réorganisation des fichiers");
    },
  });
}

export function useUpdateFileVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      fileId,
      visibility,
    }: {
      productId: string;
      fileId: string;
      visibility: "PUBLIC" | "ADMIN";
    }) => adminProductsApi.updateFileVisibility(productId, fileId, visibility),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.files(productId) });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminFiles(productId),
      });
      toast.success("Visibilité mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de la visibilité");
    },
  });
}

export function useRenameProductFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      fileId,
      filename,
    }: {
      productId: string;
      fileId: string;
      filename: string;
    }) => adminProductsApi.renameFile(productId, fileId, filename),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.files(productId) });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminFiles(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      toast.success("Fichier renommé");
    },
    onError: () => {
      toast.error("Erreur lors du renommage du fichier");
    },
  });
}

// ============================================
// ATTRIBUTE MANAGEMENT
// ============================================

export function useAddProductAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      key,
      value,
    }: {
      productId: string;
      key: string;
      value: string;
    }) => adminProductsApi.addAttribute(productId, { key, value }),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      toast.success("Attribut ajouté");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout de l'attribut");
    },
  });
}

export function useUpdateProductAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      key,
      value,
    }: {
      productId: string;
      key: string;
      value: string;
    }) => adminProductsApi.updateAttribute(productId, key, { value }),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      toast.success("Attribut mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'attribut");
    },
  });
}

export function useDeleteProductAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, key }: { productId: string; key: string }) =>
      adminProductsApi.deleteAttribute(productId, key),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(productId),
      });
      queryClient.invalidateQueries({
        queryKey: productKeys.adminDetail(productId),
      });
      toast.success("Attribut supprimé");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'attribut");
    },
  });
}

// ============================================
// PRODUCT RESERVATIONS
// ============================================

export function useProductReservations(
  productId: string | undefined,
  filters: ProductReservationsFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: productKeys.reservations(productId!, filters),
    queryFn: async () => {
      const response = await productReservationsApi.list(productId!, filters);
      return response.data.data;
    },
    enabled: !!productId && enabled,
  });
}
