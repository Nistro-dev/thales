// src/services/notification.service.ts

import { prisma } from '../utils/prisma.js'
import { logger } from '../utils/logger.js'

export enum NotificationType {
  RESERVATION_CONFIRMED = 'RESERVATION_CONFIRMED',
  RESERVATION_CANCELLED = 'RESERVATION_CANCELLED',
  RESERVATION_REFUNDED = 'RESERVATION_REFUNDED',
  RESERVATION_CHECKOUT = 'RESERVATION_CHECKOUT',
  RESERVATION_RETURN = 'RESERVATION_RETURN',
  RESERVATION_REMINDER = 'RESERVATION_REMINDER',
  RESERVATION_EXTENDED = 'RESERVATION_EXTENDED',
  RESERVATION_OVERDUE = 'RESERVATION_OVERDUE',
  RESERVATION_EXPIRED = 'RESERVATION_EXPIRED',
  CREDIT_ADDED = 'CREDIT_ADDED',
  CREDIT_REMOVED = 'CREDIT_REMOVED',
  ACCOUNT_ACTIVATED = 'ACCOUNT_ACTIVATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
}

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  title: string
  message: string
  metadata?: any
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { userId, type, title, message, metadata } = params

  // Check if user has in-app notifications enabled
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inAppNotifications: true },
  })

  if (!user?.inAppNotifications) {
    logger.info({ userId, type }, 'In-app notification skipped - disabled by user')
    return null
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      metadata,
    },
  })

  logger.info({ userId, type, notificationId: notification.id }, 'Notification created')
  return notification
}

export const listUserNotifications = async (userId: string, limit = 50, offset = 0) => {
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ])

  return { notifications, total, unreadCount }
}

export const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  })

  if (!notification) {
    throw { statusCode: 404, message: 'Notification introuvable', code: 'NOT_FOUND' }
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

export const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })

  return { count: result.count }
}

export const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  })

  if (!notification) {
    throw { statusCode: 404, message: 'Notification introuvable', code: 'NOT_FOUND' }
  }

  await prisma.notification.delete({ where: { id: notificationId } })
}
