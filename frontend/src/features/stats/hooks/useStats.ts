import { useQuery } from '@tanstack/react-query'
import { statsApi } from '@/api/stats.api'

/**
 * Realtime stats with auto-refresh every 30 seconds
 */
export function useRealtimeStats(enabled = true) {
  return useQuery({
    queryKey: ['stats', 'realtime'],
    queryFn: async () => {
      const response = await statsApi.getRealtimeStats()
      return response.data
    },
    enabled,
    refetchInterval: 30000, // 30 seconds
    staleTime: 25000,
  })
}

/**
 * Alerts with auto-refresh every 60 seconds
 */
export function useAlerts(enabled = true) {
  return useQuery({
    queryKey: ['stats', 'alerts'],
    queryFn: async () => {
      const response = await statsApi.getAlerts()
      return response.data
    },
    enabled,
    refetchInterval: 60000, // 60 seconds
    staleTime: 55000,
  })
}

/**
 * Dashboard stats for a specific period
 */
export function useDashboardStats(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ['stats', 'dashboard', from, to],
    queryFn: async () => {
      const response = await statsApi.getDashboardStats(from, to)
      return response.data
    },
    enabled: enabled && !!from && !!to,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Top products for a specific period
 */
export function useTopProducts(from: string, to: string, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['stats', 'top-products', from, to, limit],
    queryFn: async () => {
      const response = await statsApi.getTopProducts(from, to, limit)
      return response.data
    },
    enabled: enabled && !!from && !!to,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Top users for a specific period
 */
export function useTopUsers(from: string, to: string, limit = 10, enabled = true) {
  return useQuery({
    queryKey: ['stats', 'top-users', from, to, limit],
    queryFn: async () => {
      const response = await statsApi.getTopUsers(from, to, limit)
      return response.data
    },
    enabled: enabled && !!from && !!to,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Sections stats for a specific period
 */
export function useSectionsStats(from: string, to: string, enabled = true) {
  return useQuery({
    queryKey: ['stats', 'sections', from, to],
    queryFn: async () => {
      const response = await statsApi.getSectionsStats(from, to)
      return response.data
    },
    enabled: enabled && !!from && !!to,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
