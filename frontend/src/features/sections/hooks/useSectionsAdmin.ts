import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  sectionsApi,
  subSectionsApi,
  type CreateSectionInput,
  type UpdateSectionInput,
  type CreateSubSectionInput,
  type UpdateSubSectionInput,
} from '@/api/sections.api'

// ============================================
// QUERY KEYS
// ============================================

export const sectionKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionKeys.all, 'list'] as const,
  list: (includeSystem: boolean) => [...sectionKeys.lists(), { includeSystem }] as const,
  details: () => [...sectionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sectionKeys.details(), id] as const,
  orphanSubSections: () => ['subsections', 'orphans'] as const,
}

// ============================================
// LIST SECTIONS
// ============================================

export function useSectionsAdmin(includeSystem = false) {
  return useQuery({
    queryKey: sectionKeys.list(includeSystem),
    queryFn: async () => {
      const response = await sectionsApi.list(includeSystem)
      return response.data.data
    },
    staleTime: 30 * 1000,
  })
}

// ============================================
// GET SECTION DETAIL
// ============================================

export function useSectionDetail(id: string | undefined) {
  return useQuery({
    queryKey: sectionKeys.detail(id!),
    queryFn: async () => {
      const response = await sectionsApi.get(id!)
      return response.data.data
    },
    enabled: !!id,
  })
}

// ============================================
// CREATE SECTION
// ============================================

export function useCreateSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateSectionInput) => sectionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all })
      toast.success('Section créée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création de la section')
    },
  })
}

// ============================================
// UPDATE SECTION
// ============================================

export function useUpdateSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSectionInput }) =>
      sectionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all })
      queryClient.invalidateQueries({ queryKey: sectionKeys.detail(id) })
      toast.success('Section mise à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la section')
    },
  })
}

// ============================================
// DELETE SECTION
// ============================================

export function useDeleteSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => sectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all })
      toast.success('Section supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la section')
    },
  })
}

// ============================================
// CREATE SUBSECTION
// ============================================

export function useCreateSubSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: string; data: CreateSubSectionInput }) =>
      sectionsApi.createSubSection(sectionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all })
      toast.success('Sous-section créée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la création de la sous-section')
    },
  })
}

// ============================================
// UPDATE SUBSECTION
// ============================================

export function useUpdateSubSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubSectionInput }) =>
      subSectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all })
      queryClient.invalidateQueries({ queryKey: sectionKeys.orphanSubSections() })
      toast.success('Sous-section mise à jour')
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour de la sous-section')
    },
  })
}

// ============================================
// DELETE SUBSECTION
// ============================================

export function useDeleteSubSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => subSectionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.all })
      queryClient.invalidateQueries({ queryKey: sectionKeys.orphanSubSections() })
      toast.success('Sous-section supprimée')
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la sous-section')
    },
  })
}

// ============================================
// GET ORPHAN SUBSECTIONS
// ============================================

export function useOrphanSubSections() {
  return useQuery({
    queryKey: sectionKeys.orphanSubSections(),
    queryFn: async () => {
      const response = await subSectionsApi.listOrphans()
      return response.data.data
    },
  })
}
