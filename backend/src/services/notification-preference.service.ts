// src/services/notification-preference.service.ts

import { prisma } from '../utils/prisma.js'
import type { NotificationType } from '@prisma/client'

// All notification types that can be configured
export const ALL_NOTIFICATION_TYPES: NotificationType[] = [
  'RESERVATION_CONFIRMED',
  'RESERVATION_CANCELLED',
  'RESERVATION_CANCELLED_MAINTENANCE',
  'RESERVATION_REFUNDED',
  'RESERVATION_CHECKOUT',
  'RESERVATION_RETURN',
  'RESERVATION_REMINDER',
  'RESERVATION_EXTENDED',
  'RESERVATION_OVERDUE',
  'RESERVATION_EXPIRED',
  'CREDIT_ADDED',
  'CREDIT_REMOVED',
  'PASSWORD_CHANGED',
  'SYSTEM',
]

// Human-readable labels for notification types
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { label: string; description: string }> = {
  RESERVATION_CONFIRMED: {
    label: 'Réservation confirmée',
    description: 'Lorsqu\'une réservation est créée et confirmée',
  },
  RESERVATION_CANCELLED: {
    label: 'Réservation annulée',
    description: 'Lorsqu\'une réservation est annulée',
  },
  RESERVATION_CANCELLED_MAINTENANCE: {
    label: 'Annulation pour maintenance',
    description: 'Lorsqu\'une réservation est annulée suite à une maintenance',
  },
  RESERVATION_REFUNDED: {
    label: 'Remboursement',
    description: 'Lorsqu\'un remboursement est effectué',
  },
  RESERVATION_CHECKOUT: {
    label: 'Retrait effectué',
    description: 'Lorsque vous récupérez un équipement',
  },
  RESERVATION_RETURN: {
    label: 'Retour effectué',
    description: 'Lorsque vous rendez un équipement',
  },
  RESERVATION_REMINDER: {
    label: 'Rappel de réservation',
    description: 'Rappel avant le début d\'une réservation',
  },
  RESERVATION_EXTENDED: {
    label: 'Prolongation approuvée',
    description: 'Lorsqu\'une demande de prolongation est acceptée',
  },
  RESERVATION_OVERDUE: {
    label: 'Retard de retour',
    description: 'Lorsqu\'un retour est en retard',
  },
  RESERVATION_EXPIRED: {
    label: 'Réservation expirée',
    description: 'Lorsqu\'une réservation expire sans retrait',
  },
  CREDIT_ADDED: {
    label: 'Crédits ajoutés',
    description: 'Lorsque des crédits sont ajoutés à votre compte',
  },
  CREDIT_REMOVED: {
    label: 'Crédits retirés',
    description: 'Lorsque des crédits sont retirés de votre compte',
  },
  PASSWORD_CHANGED: {
    label: 'Mot de passe modifié',
    description: 'Lorsque votre mot de passe est changé',
  },
  SYSTEM: {
    label: 'Notifications système',
    description: 'Notifications importantes du système',
  },
}

export interface NotificationPreferenceItem {
  notificationType: NotificationType
  label: string
  description: string
  emailEnabled: boolean
  inAppEnabled: boolean
}

/**
 * Get all notification preferences for a user
 * Returns default values (all enabled) for types not yet configured
 */
export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreferenceItem[]> => {
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId },
  })

  const preferencesMap = new Map(preferences.map((p) => [p.notificationType, p]))

  return ALL_NOTIFICATION_TYPES.map((type) => {
    const pref = preferencesMap.get(type)
    const typeInfo = NOTIFICATION_TYPE_LABELS[type]

    return {
      notificationType: type,
      label: typeInfo.label,
      description: typeInfo.description,
      emailEnabled: pref?.emailEnabled ?? true,
      inAppEnabled: pref?.inAppEnabled ?? true,
    }
  })
}

/**
 * Update a single notification preference
 */
export const updateNotificationPreference = async (
  userId: string,
  notificationType: NotificationType,
  emailEnabled: boolean,
  inAppEnabled: boolean
) => {
  return prisma.notificationPreference.upsert({
    where: {
      userId_notificationType: { userId, notificationType },
    },
    update: { emailEnabled, inAppEnabled },
    create: { userId, notificationType, emailEnabled, inAppEnabled },
  })
}

/**
 * Update multiple notification preferences at once
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Array<{
    notificationType: NotificationType
    emailEnabled: boolean
    inAppEnabled: boolean
  }>
) => {
  const operations = preferences.map((pref) =>
    prisma.notificationPreference.upsert({
      where: {
        userId_notificationType: { userId, notificationType: pref.notificationType },
      },
      update: { emailEnabled: pref.emailEnabled, inAppEnabled: pref.inAppEnabled },
      create: {
        userId,
        notificationType: pref.notificationType,
        emailEnabled: pref.emailEnabled,
        inAppEnabled: pref.inAppEnabled,
      },
    })
  )

  return prisma.$transaction(operations)
}

/**
 * Check if a specific notification type is enabled for a user
 */
export const isNotificationEnabled = async (
  userId: string,
  notificationType: NotificationType,
  channel: 'email' | 'inApp'
): Promise<boolean> => {
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_notificationType: { userId, notificationType },
    },
  })

  // Default to enabled if no preference is set
  if (!preference) {
    return true
  }

  return channel === 'email' ? preference.emailEnabled : preference.inAppEnabled
}

/**
 * Get notification preferences for multiple types at once (more efficient)
 */
export const getNotificationPreferencesForTypes = async (
  userId: string,
  notificationTypes: NotificationType[]
): Promise<Map<NotificationType, { emailEnabled: boolean; inAppEnabled: boolean }>> => {
  const preferences = await prisma.notificationPreference.findMany({
    where: {
      userId,
      notificationType: { in: notificationTypes },
    },
  })

  const result = new Map<NotificationType, { emailEnabled: boolean; inAppEnabled: boolean }>()

  // Set defaults for all requested types
  for (const type of notificationTypes) {
    result.set(type, { emailEnabled: true, inAppEnabled: true })
  }

  // Override with actual preferences
  for (const pref of preferences) {
    result.set(pref.notificationType, {
      emailEnabled: pref.emailEnabled,
      inAppEnabled: pref.inAppEnabled,
    })
  }

  return result
}
