// src/services/notification-helper.service.ts

import { prisma } from '../utils/prisma.js'
import * as notificationService from './notification.service.js'
import * as emailService from './email.service.js'
import { NotificationType } from './notification.service.js'

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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
  await notificationService.createNotification({
    userId,
    type: NotificationType.RESERVATION_CONFIRMED,
    title: 'Réservation confirmée',
    message: `Votre réservation pour ${productName} du ${startDate} au ${endDate} a été confirmée.`,
    metadata: { reservationId },
  })
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
  await notificationService.createNotification({
    userId,
    type: NotificationType.RESERVATION_CANCELLED,
    title: 'Réservation annulée',
    message: `Votre réservation pour ${productName} a été annulée.${cancelReason ? ` Raison : ${cancelReason}` : ''}`,
    metadata: { reservationId, cancelReason },
  })
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
  await notificationService.createNotification({
    userId,
    type: NotificationType.RESERVATION_REFUNDED,
    title: 'Réservation remboursée',
    message: `Un remboursement de ${refundAmount} crédits a été effectué pour votre réservation de ${productName}.`,
    metadata: { reservationId, refundAmount, newBalance },
  })
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
  await notificationService.createNotification({
    userId,
    type: NotificationType.RESERVATION_CHECKOUT,
    title: 'Matériel retiré',
    message: `Vous avez retiré le matériel ${productName}. Bon usage !`,
    metadata: { reservationId },
  })
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
      emailNotifications: true,
    },
  })

  if (!user) return

  const isAdded = amount > 0

  // Email
  if (user.emailNotifications) {
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
  await notificationService.createNotification({
    userId,
    type: NotificationType.RESERVATION_EXTENDED,
    title: 'Réservation prolongée',
    message: `Votre réservation pour ${productName} a été prolongée jusqu'au ${newEndDate}. Coût : ${cost} crédits.`,
    metadata: { reservationId, cost, newEndDate },
  })
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
  await notificationService.createNotification({
    userId,
    type: NotificationType.RESERVATION_OVERDUE,
    title: 'Retour en retard',
    message: `Le matériel ${productName} aurait dû être retourné le ${endDate}. Retard : ${daysOverdue} jour(s).`,
    metadata: { reservationId, daysOverdue, endDate },
  })
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
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
  await notificationService.createNotification({
    userId,
    type: NotificationType.RESERVATION_EXPIRED,
    title: 'Réservation expirée',
    message: `Votre réservation pour ${productName} (${startDate} - ${endDate}) a expiré sans retrait.`,
    metadata: { reservationId, startDate, endDate },
  })
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
      emailNotifications: true,
    },
  })

  if (!user) return

  // Email
  if (user.emailNotifications) {
    await emailService.sendPasswordChangedEmail(email, {
      firstName: user.firstName,
      lastName: user.lastName,
    })
  }

  // In-app notification
  await notificationService.createNotification({
    userId,
    type: NotificationType.PASSWORD_CHANGED,
    title: 'Mot de passe modifié',
    message: 'Votre mot de passe a été modifié avec succès.',
    metadata: {},
  })
}
