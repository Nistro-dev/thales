// src/controllers/notification.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as notificationService from '../services/notification.service.js'
import { createSuccessResponse } from '../utils/response.js'
import { prisma } from '../utils/prisma.js'

// GET /api/notifications
export const listNotifications = async (request: FastifyRequest, reply: FastifyReply) => {
  const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number }

  const result = await notificationService.listUserNotifications(
    request.user.userId,
    Number(limit),
    Number(offset)
  )

  return reply.send(
    createSuccessResponse('Notifications récupérées avec succès', result)
  )
}

// PATCH /api/notifications/:id/read
export const markAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }

  await notificationService.markAsRead(id, request.user.userId)

  return reply.send(createSuccessResponse('Notification marquée comme lue', null))
}

// PATCH /api/notifications/read-all
export const markAllAsRead = async (request: FastifyRequest, reply: FastifyReply) => {
  const count = await notificationService.markAllAsRead(request.user.userId)

  return reply.send(
    createSuccessResponse('Toutes les notifications ont été marquées comme lues', { count })
  )
}

// DELETE /api/notifications/:id
export const deleteNotification = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }

  await notificationService.deleteNotification(id, request.user.userId)

  return reply.send(createSuccessResponse('Notification supprimée', null))
}

// GET /api/notifications/unread-count
export const getUnreadCount = async (request: FastifyRequest, reply: FastifyReply) => {
  const count = await prisma.notification.count({
    where: {
      userId: request.user.userId,
      read: false,
    },
  })

  return reply.send(createSuccessResponse('Nombre de notifications non lues', { count }))
}
