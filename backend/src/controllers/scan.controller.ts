// src/controllers/scan.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as qrService from '../services/qr.service.js'
import * as reservationService from '../services/reservation.service.js'
import { createSuccessResponse } from '../utils/response.js'
import type { CheckoutInput, ReturnInput } from '../schemas/movement.js'

export const scanProduct = async (
  request: FastifyRequest<{ Params: { qrCode: string } }>,
  reply: FastifyReply
) => {
  const result = await qrService.getProductByQRCode(request.params.qrCode)
  return reply.send(createSuccessResponse('Product found', result))
}

export const scanCheckout = async (
  request: FastifyRequest<{ Params: { qrCode: string }; Body: CheckoutInput }>,
  reply: FastifyReply
) => {
  const { product, activeReservation } = await qrService.getProductByQRCode(request.params.qrCode)

  if (!activeReservation) {
    throw {
      statusCode: 400,
      message: 'No active reservation for this product',
      code: 'VALIDATION_ERROR',
    }
  }

  if (activeReservation.status !== 'CONFIRMED') {
    throw {
      statusCode: 400,
      message: 'Reservation is not in CONFIRMED status',
      code: 'VALIDATION_ERROR',
    }
  }

  const reservation = await reservationService.checkoutReservation({
    reservationId: activeReservation.id,
    adminId: request.user.userId,
    notes: request.body?.notes,
    request,
  })

  return reply.send(createSuccessResponse('Product checked out', reservation))
}

export const scanReturn = async (
  request: FastifyRequest<{ Params: { qrCode: string }; Body: ReturnInput }>,
  reply: FastifyReply
) => {
  const { product, activeReservation } = await qrService.getProductByQRCode(request.params.qrCode)

  if (!activeReservation) {
    throw {
      statusCode: 400,
      message: 'No active reservation for this product',
      code: 'VALIDATION_ERROR',
    }
  }

  if (activeReservation.status !== 'CHECKED_OUT') {
    throw { statusCode: 400, message: 'Product is not checked out', code: 'VALIDATION_ERROR' }
  }

  const reservation = await reservationService.returnReservation({
    reservationId: activeReservation.id,
    adminId: request.user.userId,
    condition: request.body?.condition,
    notes: request.body?.notes,
    request,
  })

  return reply.send(createSuccessResponse('Product returned', reservation))
}