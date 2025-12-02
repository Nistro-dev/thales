// src/controllers/notification-preference.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as notificationPreferenceService from '../services/notification-preference.service.js'
import { ALL_NOTIFICATION_TYPES } from '../services/notification-preference.service.js'
import type { NotificationType } from '@prisma/client'

/**
 * Get all notification preferences for the authenticated user
 */
export const getPreferences = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.userId

    const preferences = await notificationPreferenceService.getUserNotificationPreferences(userId)

    return reply.send({
      success: true,
      message: 'Préférences de notification récupérées',
      data: preferences,
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      message: 'Erreur lors de la récupération des préférences',
      code: 'INTERNAL_ERROR',
    })
  }
}

/**
 * Update a single notification preference
 */
export const updatePreference = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.userId
    const { type } = request.params as { type: string }
    const { emailEnabled, inAppEnabled } = request.body as {
      emailEnabled?: boolean
      inAppEnabled?: boolean
    }

    // Validate notification type
    if (!ALL_NOTIFICATION_TYPES.includes(type as NotificationType)) {
      return reply.status(400).send({
        success: false,
        message: 'Type de notification invalide',
        code: 'VALIDATION_ERROR',
      })
    }

    // Get current preference to merge with updates
    const currentPreferences = await notificationPreferenceService.getUserNotificationPreferences(userId)
    const current = currentPreferences.find((p) => p.notificationType === type)

    const preference = await notificationPreferenceService.updateNotificationPreference(
      userId,
      type as NotificationType,
      emailEnabled ?? current?.emailEnabled ?? true,
      inAppEnabled ?? current?.inAppEnabled ?? true
    )

    return reply.send({
      success: true,
      message: 'Préférence mise à jour',
      data: preference,
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      message: 'Erreur lors de la mise à jour de la préférence',
      code: 'INTERNAL_ERROR',
    })
  }
}

/**
 * Update multiple notification preferences at once
 */
export const updatePreferences = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.userId
    const { preferences } = request.body as {
      preferences: Array<{
        notificationType: string
        emailEnabled: boolean
        inAppEnabled: boolean
      }>
    }

    if (!preferences || !Array.isArray(preferences)) {
      return reply.status(400).send({
        success: false,
        message: 'Le champ preferences est requis et doit être un tableau',
        code: 'VALIDATION_ERROR',
      })
    }

    // Validate all notification types
    for (const pref of preferences) {
      if (!ALL_NOTIFICATION_TYPES.includes(pref.notificationType as NotificationType)) {
        return reply.status(400).send({
          success: false,
          message: `Type de notification invalide: ${pref.notificationType}`,
          code: 'VALIDATION_ERROR',
        })
      }
    }

    await notificationPreferenceService.updateNotificationPreferences(
      userId,
      preferences.map((p) => ({
        notificationType: p.notificationType as NotificationType,
        emailEnabled: p.emailEnabled,
        inAppEnabled: p.inAppEnabled,
      }))
    )

    // Return updated preferences
    const updatedPreferences = await notificationPreferenceService.getUserNotificationPreferences(userId)

    return reply.send({
      success: true,
      message: 'Préférences mises à jour',
      data: updatedPreferences,
    })
  } catch (error: any) {
    request.log.error(error)
    return reply.status(500).send({
      success: false,
      message: 'Erreur lors de la mise à jour des préférences',
      code: 'INTERNAL_ERROR',
    })
  }
}
