// src/services/notification-helper.service.ts

import { prisma } from '../utils/prisma.js'
import * as notificationService from './notification.service.js'
import * as emailService from './email.service.js'
import { NotificationType } from './notification.service.js'
import { isNotificationEnabled } from './notification-preference.service.js'
import type { NotificationType as PrismaNotificationType } from '@prisma/client'

/**
 * Check if email should be sent based on user preferences
 */
const shouldSendEmail = async (userId: string, type: PrismaNotificationType): Promise<boolean> => {
  return isNotificationEnabled(userId, type, 'email')
}

/**
 * Check if in-app notification should be created based on user preferences
 */
const shouldSendInApp = async (userId: string, type: PrismaNotificationType): Promise<boolean> => {
  return isNotificationEnabled(userId, type, 'inApp')
}

/**
 * Send both email and in-app notification based on user preferences
 */
export const sendReservationConfirmedNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_CONFIRMED'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })

    if (reservation) {
      const duration = Math.ceil(
        (reservation.endDate.getTime() - reservation.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      await emailService.sendReservationConfirmedEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        productName: reservation.product.name,
        productReference: reservation.product.reference || undefined,
        startDate: reservation.startDate.toLocaleDateString('fr-FR'),
        endDate: reservation.endDate.toLocaleDateString('fr-FR'),
        duration,
        creditsCharged: reservation.creditsCharged,
        reservationId: reservation.id,
        notes: reservation.notes || undefined,
      })
    }
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_CONFIRMED,
      title: 'Réservation confirmée',
      message: `Votre réservation pour ${productName} du ${startDate} au ${endDate} a été confirmée.`,
      metadata: { reservationId },
    })
  }
}

export const sendReservationCancelledNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  cancelReason?: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_CANCELLED'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })

    if (reservation) {
      const duration = Math.ceil(
        (reservation.endDate.getTime() - reservation.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      await emailService.sendReservationCancelledEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        productName: reservation.product.name,
        productReference: reservation.product.reference || undefined,
        startDate: reservation.startDate.toLocaleDateString('fr-FR'),
        endDate: reservation.endDate.toLocaleDateString('fr-FR'),
        duration,
        creditsCharged: reservation.creditsCharged,
        reservationId: reservation.id,
        cancelReason,
      })
    }
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_CANCELLED,
      title: 'Réservation annulée',
      message: `Votre réservation pour ${productName} a été annulée.${cancelReason ? ` Raison : ${cancelReason}` : ''}`,
      metadata: { reservationId, cancelReason },
    })
  }
}

export const sendReservationRefundedNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  refundAmount: number,
  newBalance: number
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_REFUNDED'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })

    if (reservation) {
      const duration = Math.ceil(
        (reservation.endDate.getTime() - reservation.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      await emailService.sendReservationRefundedEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        productName: reservation.product.name,
        productReference: reservation.product.reference || undefined,
        startDate: reservation.startDate.toLocaleDateString('fr-FR'),
        endDate: reservation.endDate.toLocaleDateString('fr-FR'),
        duration,
        creditsCharged: reservation.creditsCharged,
        reservationId: reservation.id,
        refundAmount,
        newBalance,
        adminNotes: reservation.adminNotes || undefined,
      })
    }
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_REFUNDED,
      title: 'Réservation remboursée',
      message: `Un remboursement de ${refundAmount} crédits a été effectué pour votre réservation de ${productName}.`,
      metadata: { reservationId, refundAmount, newBalance },
    })
  }
}

export const sendCheckoutNotification = async (
  userId: string,
  reservationId: string,
  productName: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_CHECKOUT'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })

    if (reservation && reservation.checkedOutAt) {
      const duration = Math.ceil(
        (reservation.endDate.getTime() - reservation.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      await emailService.sendCheckoutCompletedEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        productName: reservation.product.name,
        productReference: reservation.product.reference || undefined,
        startDate: reservation.startDate.toLocaleDateString('fr-FR'),
        endDate: reservation.endDate.toLocaleDateString('fr-FR'),
        duration,
        creditsCharged: reservation.creditsCharged,
        reservationId: reservation.id,
        checkedOutAt: reservation.checkedOutAt.toLocaleString('fr-FR'),
        notes: reservation.notes || undefined,
      })
    }
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_CHECKOUT,
      title: 'Matériel retiré',
      message: `Vous avez retiré le matériel ${productName}. Bon usage !`,
      metadata: { reservationId },
    })
  }
}

export const sendReturnNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  condition: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_RETURN'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })

    if (reservation && reservation.returnedAt) {
      const duration = Math.ceil(
        (reservation.endDate.getTime() - reservation.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Count photos if any
      const movement = await prisma.productMovement.findFirst({
        where: {
          reservationId,
          type: 'RETURN',
        },
        include: {
          photos: true,
        },
      })

      await emailService.sendReturnCompletedEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        productName: reservation.product.name,
        productReference: reservation.product.reference || undefined,
        startDate: reservation.startDate.toLocaleDateString('fr-FR'),
        endDate: reservation.endDate.toLocaleDateString('fr-FR'),
        duration,
        creditsCharged: reservation.creditsCharged,
        reservationId: reservation.id,
        returnedAt: reservation.returnedAt.toLocaleString('fr-FR'),
        condition,
        hasPhotos: movement ? movement.photos.length > 0 : false,
        photoCount: movement ? movement.photos.length : 0,
        notes: reservation.notes || undefined,
      })
    }
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    const conditionText =
      condition === 'OK' ? 'en excellent état' : 'avec des dommages constatés'
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_RETURN,
      title: 'Retour enregistré',
      message: `Le retour de ${productName} a été enregistré ${conditionText}.`,
      metadata: { reservationId, condition },
    })
  }
}

export const sendCreditAdjustmentNotification = async (
  userId: string,
  amount: number,
  newBalance: number,
  reason?: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const isAdded = amount > 0
  const notificationType: PrismaNotificationType = isAdded ? 'CREDIT_ADDED' : 'CREDIT_REMOVED'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    if (isAdded) {
      await emailService.sendCreditAddedEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        amount,
        newBalance,
        reason,
      })
    } else {
      await emailService.sendCreditRemovedEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        amount: Math.abs(amount),
        newBalance,
        reason,
      })
    }
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: isAdded ? NotificationType.CREDIT_ADDED : NotificationType.CREDIT_REMOVED,
      title: isAdded ? 'Crédits ajoutés' : 'Crédits retirés',
      message: isAdded
        ? `${amount} crédits ont été ajoutés à votre compte.`
        : `${Math.abs(amount)} crédits ont été retirés de votre compte.`,
      metadata: { amount, newBalance, reason },
    })
  }
}

// Extension notification (automatic confirmation)
export const sendExtensionConfirmedNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  newEndDate: string,
  cost: number
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_EXTENDED'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    await emailService.sendExtensionConfirmedEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      productName,
      newEndDate,
      cost,
      reservationId,
    })
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_EXTENDED,
      title: 'Réservation prolongée',
      message: `Votre réservation pour ${productName} a été prolongée jusqu'au ${newEndDate}. Coût : ${cost} crédits.`,
      metadata: { reservationId, cost, newEndDate },
    })
  }
}

// Overdue and expired notifications
export const sendReservationOverdueNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  endDate: string,
  daysOverdue: number
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_OVERDUE'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    await emailService.sendReservationOverdueEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      productName,
      endDate,
      daysOverdue,
      reservationId,
    })
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_OVERDUE,
      title: 'Retour en retard',
      message: `Le matériel ${productName} aurait dû être retourné le ${endDate}. Retard : ${daysOverdue} jour(s).`,
      metadata: { reservationId, daysOverdue, endDate },
    })
  }
}

export const sendReservationExpiredNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  startDate: string,
  endDate: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_EXPIRED'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    await emailService.sendReservationExpiredEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      productName,
      startDate,
      endDate,
      reservationId,
    })
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_EXPIRED,
      title: 'Réservation expirée',
      message: `Votre réservation pour ${productName} (${startDate} - ${endDate}) a expiré sans retrait.`,
      metadata: { reservationId, startDate, endDate },
    })
  }
}

export const sendPasswordChangedNotification = async (
  userId: string,
  email: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  // Security notifications are always sent (not configurable by user)
  // Email
  await emailService.sendPasswordChangedEmail(email, {
    firstName: user.firstName,
    lastName: user.lastName,
  })

  // In-app notification
  await notificationService.createNotification({
    userId,
    type: NotificationType.PASSWORD_CHANGED,
    title: 'Mot de passe modifié',
    message: 'Votre mot de passe a été modifié avec succès.',
    metadata: {},
  })
}

// Maintenance cancellation notification
export const sendMaintenanceCancellationNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  refundAmount: number,
  maintenanceReason?: string
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
      creditBalance: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_CANCELLED_MAINTENANCE'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        product: true,
      },
    })

    if (reservation) {
      const duration = Math.ceil(
        (reservation.endDate.getTime() - reservation.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      await emailService.sendReservationCancelledMaintenanceEmail(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        productName: reservation.product.name,
        productReference: reservation.product.reference || undefined,
        startDate: reservation.startDate.toLocaleDateString('fr-FR'),
        endDate: reservation.endDate.toLocaleDateString('fr-FR'),
        duration,
        creditsCharged: reservation.creditsCharged,
        reservationId: reservation.id,
        refundAmount,
        newBalance: user.creditBalance,
        maintenanceReason,
      })
    }
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    const reasonText = maintenanceReason ? ` Raison : ${maintenanceReason}` : ''
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_CANCELLED,
      title: 'Réservation annulée (maintenance)',
      message: `Votre réservation pour ${productName} a été annulée en raison d'une maintenance.${reasonText} Vos ${refundAmount} crédits ont été remboursés.`,
      metadata: { reservationId, refundAmount, maintenanceReason },
    })
  }
}

// Reminder notification (for scheduled reminders)
export const sendReservationReminderNotification = async (
  userId: string,
  reservationId: string,
  productName: string,
  startDate: string,
  endDate: string,
  duration: number,
  creditsCharged: number
): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      firstName: true,
      lastName: true,
    },
  })

  if (!user) return

  const notificationType: PrismaNotificationType = 'RESERVATION_REMINDER'

  // Email
  if (await shouldSendEmail(userId, notificationType)) {
    await emailService.sendReservationReminderEmail(user.email, {
      firstName: user.firstName,
      lastName: user.lastName,
      productName,
      startDate,
      endDate,
      duration,
      creditsCharged,
      reservationId,
    })
  }

  // In-app notification
  if (await shouldSendInApp(userId, notificationType)) {
    await notificationService.createNotification({
      userId,
      type: NotificationType.RESERVATION_REMINDER,
      title: 'Rappel de réservation',
      message: `N'oubliez pas : votre réservation pour ${productName} commence le ${startDate}.`,
      metadata: { reservationId, startDate },
    })
  }
}
