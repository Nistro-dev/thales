// src/routes/notification.routes.ts

import { FastifyInstance } from 'fastify'
import * as notificationController from '../controllers/notification.controller.js'
import * as notificationPreferenceController from '../controllers/notification-preference.controller.js'
import { authMiddleware } from '../middlewares/auth.js'

export default async function notificationRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware)

  // ============================================
  // NOTIFICATION PREFERENCES
  // ============================================

  // Get user notification preferences
  fastify.get('/preferences', notificationPreferenceController.getPreferences)

  // Update a single notification preference
  fastify.patch('/preferences/:type', notificationPreferenceController.updatePreference)

  // Update multiple notification preferences at once
  fastify.put('/preferences', notificationPreferenceController.updatePreferences)

  // ============================================
  // NOTIFICATIONS
  // ============================================

  // List user notifications
  fastify.get('/', notificationController.listNotifications)

  // Get unread count
  fastify.get('/unread-count', notificationController.getUnreadCount)

  // Mark single notification as read
  fastify.patch('/:id/read', notificationController.markAsRead)

  // Mark all notifications as read
  fastify.patch('/read-all', notificationController.markAllAsRead)

  // Delete all notifications (must be before /:id)
  fastify.delete('/all', notificationController.deleteAllNotifications)

  // Delete notification
  fastify.delete('/:id', notificationController.deleteNotification)
}
