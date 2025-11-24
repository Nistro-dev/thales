// src/controllers/reservation.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as reservationService from '../services/reservation.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import { listReservationsSchema } from '../schemas/reservation.js'
import type {
  CreateReservationInput,
  CreateReservationAdminInput,
  UpdateReservationInput,
  CancelReservationInput,
  ListReservationsInput,
  AvailabilityInput,
  RefundReservationInput,
} from '../schemas/reservation.js'
import type { CheckoutInput, ReturnInput } from '../schemas/movement.js'

// ============================================
// USER ROUTES
// ============================================

export const listMyReservations = async (
  request: FastifyRequest<{ Querystring: ListReservationsInput }>,
  reply: FastifyReply
) => {
  const query = listReservationsSchema.parse(request.query)
  const { reservations, total } = await reservationService.listReservations(query, request.user.userId)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, reservations, {
      page: query.page,
      limit: query.limit,
      total,
    })
  )
}

export const getMyReservation = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.getReservationById(
    request.params.id,
    request.user.userId
  )

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, reservation))
}

export const create = async (
  request: FastifyRequest<{ Body: CreateReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.createReservation({
    userId: request.user.userId,
    productId: request.body.productId,
    startDate: request.body.startDate,
    endDate: request.body.endDate,
    notes: request.body.notes,
    createdBy: request.user.userId,
    isAdmin: false,
    request,
  })

  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, reservation))
}

export const cancelMine = async (
  request: FastifyRequest<{ Params: { id: string }; Body: CancelReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.cancelReservation({
    reservationId: request.params.id,
    userId: request.user.userId,
    isAdmin: false,
    reason: request.body.reason,
    request,
  })

  return reply.send(createSuccessResponse('Reservation cancelled and refunded', reservation))
}

// ============================================
// ADMIN ROUTES
// ============================================

export const listAll = async (
  request: FastifyRequest<{ Querystring: ListReservationsInput }>,
  reply: FastifyReply
) => {
  const query = listReservationsSchema.parse(request.query)
  const { reservations, total } = await reservationService.listReservations(query)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, reservations, {
      page: query.page,
      limit: query.limit,
      total,
    })
  )
}

export const getById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.getReservationById(request.params.id)

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, reservation))
}

export const createAdmin = async (
  request: FastifyRequest<{ Body: CreateReservationAdminInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.createReservation({
    userId: request.body.userId,
    productId: request.body.productId,
    startDate: request.body.startDate,
    endDate: request.body.endDate,
    notes: request.body.notes,
    adminNotes: request.body.adminNotes,
    createdBy: request.user.userId,
    isAdmin: true,
    request,
  })

  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, reservation))
}

export const update = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.updateReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    ...request.body,
    request,
  })

  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, reservation))
}

export const cancelAdmin = async (
  request: FastifyRequest<{ Params: { id: string }; Body: CancelReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.cancelReservation({
    reservationId: request.params.id,
    userId: request.user.userId,
    isAdmin: true,
    reason: request.body.reason,
    request,
  })

  return reply.send(createSuccessResponse('Reservation cancelled and refunded', reservation))
}

export const refund = async (
  request: FastifyRequest<{ Params: { id: string }; Body: RefundReservationInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.refundReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    amount: request.body.amount,
    reason: request.body.reason,
    request,
  })

  return reply.send(createSuccessResponse('Reservation refunded', reservation))
}

export const checkout = async (
  request: FastifyRequest<{ Params: { id: string }; Body?: CheckoutInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.checkoutReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    notes: request.body?.notes,
    request,
  })

  return reply.send(createSuccessResponse(SuccessMessages.PRODUCT_CHECKED_OUT, reservation))
}

export const returnProduct = async (
  request: FastifyRequest<{ Params: { id: string }; Body?: ReturnInput }>,
  reply: FastifyReply
) => {
  const reservation = await reservationService.returnReservation({
    reservationId: request.params.id,
    adminId: request.user.userId,
    condition: request.body?.condition,
    notes: request.body?.notes,
    photoKey: request.body?.photoKey,
    request,
  })

  return reply.send(createSuccessResponse(SuccessMessages.PRODUCT_RETURNED, reservation))
}

// ============================================
// AVAILABILITY
// ============================================

export const getAvailability = async (
  request: FastifyRequest<{ Params: { id: string }; Querystring: AvailabilityInput }>,
  reply: FastifyReply
) => {
  const availability = await reservationService.getProductAvailability(
    request.params.id,
    request.query.month
  )

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, availability))
}

export const checkAvailability = async (
  request: FastifyRequest<{
    Params: { id: string }
    Querystring: { startDate: string; endDate: string }
  }>,
  reply: FastifyReply
) => {
  const result = await reservationService.checkAvailability(
    request.params.id,
    request.query.startDate,
    request.query.endDate
  )

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, result))
}
