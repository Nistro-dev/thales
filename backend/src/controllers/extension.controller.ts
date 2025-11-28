// src/controllers/extension.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as extensionService from '../services/reservation-extension.service.js'
import { createSuccessResponse } from '../utils/response.js'

// GET /api/reservations/:id/extension/info - Check if extension is possible
export const checkExtension = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const { newEndDate } = request.query as { newEndDate: string }

  if (!newEndDate) {
    throw {
      statusCode: 400,
      message: 'La nouvelle date de fin est requise',
      code: 'VALIDATION_ERROR',
    }
  }

  const result = await extensionService.checkExtensionPossible({
    reservationId: id,
    newEndDate,
  })

  return reply.send(
    createSuccessResponse('Vérification de la prolongation', result)
  )
}

// POST /api/reservations/:id/extend - Extend reservation (automatic)
export const extendReservation = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const { newEndDate } = request.body as { newEndDate: string }

  const updated = await extensionService.extendReservation({
    reservationId: id,
    userId: request.user.userId,
    newEndDate,
    request,
  })

  return reply.send(
    createSuccessResponse('Réservation prolongée avec succès', updated)
  )
}
