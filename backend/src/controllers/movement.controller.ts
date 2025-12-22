// src/controllers/movement.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as movementService from '../services/movement.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import type { ListMovementsInput } from '../schemas/movement.js'

export const listMovements = async (
  request: FastifyRequest<{ Querystring: ListMovementsInput }>,
  reply: FastifyReply
) => {
  const page = request.query.page || 1
  const limit = request.query.limit || 20

  const { movements, total } = await movementService.listMovements({
    page,
    limit,
    productId: request.query.productId,
    reservationId: request.query.reservationId,
    type: request.query.type,
    sortOrder: request.query.sortOrder || 'desc',
  })

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, movements, {
      page,
      limit,
      total,
    })
  )
}

export const getProductMovements = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const movements = await movementService.getProductMovements(request.params.id)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, movements))
}
