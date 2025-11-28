import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/api/notifications.api'

/**
 * Get user notifications list
 */
export function useNotifications(limit = 50, offset = 0, enabled = true) {
  return useQuery({
    queryKey: ['notifications', limit, offset],
    queryFn: async () => {
      const response = await notificationsApi.list(limit, offset)
      return response.data
    },
    enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

/**
 * Get unread notifications count
 */
export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await notificationsApi.getUnreadCount()
      return response.data!.count
    },
    enabled,
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}

/**
 * Mark single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.markAsRead(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await notificationsApi.markAllAsRead()
      return response.data!.count
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationsApi.delete(id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}

/**
 * Delete all notifications
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await notificationsApi.deleteAll()
      return response.data!.count
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })
}
