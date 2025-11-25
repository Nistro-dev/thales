// src/routes/notification.routes.ts

import { FastifyInstance } from 'fastify'
import * as notificationController from '../controllers/notification.controller.js'
import { authMiddleware } from '../middlewares/auth.js'

export default async function notificationRoutes(fastify: FastifyInstance) {
  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware)

  // List user notifications
  fastify.get('/', notificationController.listNotifications)

  // Get unread count
  fastify.get('/unread-count', notificationController.getUnreadCount)

  // Mark single notification as read
  fastify.patch('/:id/read', notificationController.markAsRead)

  // Mark all notifications as read
  fastify.patch('/read-all', notificationController.markAllAsRead)

  // Delete notification
  fastify.delete('/:id', notificationController.deleteNotification)
}
