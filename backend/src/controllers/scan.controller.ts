// src/controllers/scan.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../utils/prisma.js'
import * as reservationService from '../services/reservation.service.js'
import { createSuccessResponse } from '../utils/response.js'
import { verifyReservationQRCode, isReservationQRCode } from '../utils/qrCode.js'
import type { CheckoutInput, ReturnInput } from '../schemas/movement.js'

export const scanProduct = async (
  request: FastifyRequest<{ Params: { qrCode: string } }>,
  reply: FastifyReply
) => {
  const qrCode = request.params.qrCode

  // Only accept reservation QR codes
  if (!isReservationQRCode(qrCode)) {
    throw {
      statusCode: 400,
      message: 'Format de QR code invalide. Seuls les QR codes de réservation sont acceptés.',
      code: 'INVALID_QR_CODE',
    }
  }

  // Scan reservation QR code - get reservation details
  const { reservationId } = verifyReservationQRCode(qrCode)

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      product: {
        select: {
          id: true,
          name: true,
          reference: true,
          description: true,
          lastCondition: true,
          lastMovementAt: true,
        },
      },
    },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  return reply.send(
    createSuccessResponse('Réservation trouvée', {
      type: 'reservation',
      reservation,
    })
  )
}

export const scanCheckout = async (
  request: FastifyRequest<{ Params: { qrCode: string }; Body: CheckoutInput }>,
  reply: FastifyReply
) => {
  const qrCode = request.params.qrCode

  // Only accept reservation QR codes
  if (!isReservationQRCode(qrCode)) {
    throw {
      statusCode: 400,
      message: 'Format de QR code invalide. Seuls les QR codes de réservation sont acceptés.',
      code: 'INVALID_QR_CODE',
    }
  }

  // Extract reservation ID from QR code
  const { reservationId } = verifyReservationQRCode(qrCode)

  // Verify reservation exists and is in correct status
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (reservation.status !== 'CONFIRMED') {
    throw {
      statusCode: 400,
      message: 'La réservation doit être au statut CONFIRMED pour le retrait',
      code: 'VALIDATION_ERROR',
    }
  }

  const updatedReservation = await reservationService.checkoutReservation({
    reservationId,
    adminId: request.user.userId,
    notes: request.body?.notes,
    request,
  })

  return reply.send(createSuccessResponse('Produit retiré avec succès', updatedReservation))
}

export const scanReturn = async (
  request: FastifyRequest<{ Params: { qrCode: string }; Body: ReturnInput }>,
  reply: FastifyReply
) => {
  const qrCode = request.params.qrCode

  // Only accept reservation QR codes
  if (!isReservationQRCode(qrCode)) {
    throw {
      statusCode: 400,
      message: 'Format de QR code invalide. Seuls les QR codes de réservation sont acceptés.',
      code: 'INVALID_QR_CODE',
    }
  }

  // Extract reservation ID from QR code
  const { reservationId } = verifyReservationQRCode(qrCode)

  // Verify reservation exists and is in correct status
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  })

  if (!reservation) {
    throw { statusCode: 404, message: 'Réservation introuvable', code: 'NOT_FOUND' }
  }

  if (reservation.status !== 'CHECKED_OUT') {
    throw {
      statusCode: 400,
      message: 'La réservation doit être au statut CHECKED_OUT pour le retour',
      code: 'VALIDATION_ERROR',
    }
  }

  const updatedReservation = await reservationService.returnReservation({
    reservationId,
    adminId: request.user.userId,
    condition: request.body?.condition,
    notes: request.body?.notes,
    photoKey: request.body?.photoKey,
    request,
  })

  return reply.send(createSuccessResponse('Produit retourné avec succès', updatedReservation))
}