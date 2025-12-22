// src/controllers/maintenance.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as maintenanceService from '../services/maintenance.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'

// ============================================
// TYPES
// ============================================

interface CreateMaintenanceBody {
  startDate: string
  endDate?: string | null
  reason?: string | null
}

interface UpdateMaintenanceBody {
  endDate?: string | null
  reason?: string | null
}

interface ProductIdParams {
  id: string
}

interface MaintenanceIdParams {
  id: string
  maintenanceId: string
}

// ============================================
// HANDLERS
// ============================================

/**
 * Create a new maintenance for a product
 * POST /products/:id/maintenance
 */
export const create = async (
  request: FastifyRequest<{ Params: ProductIdParams; Body: CreateMaintenanceBody }>,
  reply: FastifyReply
) => {
  const result = await maintenanceService.createMaintenance({
    productId: request.params.id,
    startDate: request.body.startDate,
    endDate: request.body.endDate,
    reason: request.body.reason,
    performedBy: request.user.userId,
  })

  return reply.status(201).send(
    createSuccessResponse(SuccessMessages.CREATED, {
      maintenance: result.maintenance,
      cancelledReservationsCount: result.cancelledReservationsCount,
      refundedCreditsTotal: result.refundedCreditsTotal,
    })
  )
}

/**
 * Update a maintenance
 * PATCH /products/:id/maintenance/:maintenanceId
 */
export const update = async (
  request: FastifyRequest<{ Params: MaintenanceIdParams; Body: UpdateMaintenanceBody }>,
  reply: FastifyReply
) => {
  const maintenance = await maintenanceService.updateMaintenance({
    maintenanceId: request.params.maintenanceId,
    endDate: request.body.endDate,
    reason: request.body.reason,
    performedBy: request.user.userId,
  })

  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, maintenance))
}

/**
 * End a maintenance early
 * POST /products/:id/maintenance/:maintenanceId/end
 */
export const end = async (
  request: FastifyRequest<{ Params: MaintenanceIdParams }>,
  reply: FastifyReply
) => {
  const maintenance = await maintenanceService.endMaintenance(
    request.params.maintenanceId,
    request.user.userId
  )

  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, maintenance))
}

/**
 * Cancel a scheduled maintenance (before it starts)
 * DELETE /products/:id/maintenance/:maintenanceId
 */
export const cancel = async (
  request: FastifyRequest<{ Params: MaintenanceIdParams }>,
  reply: FastifyReply
) => {
  await maintenanceService.cancelMaintenance(
    request.params.maintenanceId,
    request.user.userId
  )

  return reply.send(createSuccessResponse(SuccessMessages.DELETED, null))
}

/**
 * Get all maintenances for a product (history)
 * GET /products/:id/maintenance
 */
export const list = async (
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply
) => {
  const maintenances = await maintenanceService.getProductMaintenances(request.params.id)

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, maintenances))
}

/**
 * Get the active maintenance for a product
 * GET /products/:id/maintenance/active
 */
export const getActive = async (
  request: FastifyRequest<{ Params: ProductIdParams }>,
  reply: FastifyReply
) => {
  const activeMaintenance = await maintenanceService.getActiveMaintenance(request.params.id)
  const scheduledMaintenances = await maintenanceService.getScheduledMaintenances(request.params.id)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, {
      active: activeMaintenance,
      scheduled: scheduledMaintenances,
    })
  )
}

/**
 * Get a single maintenance by ID
 * GET /products/:id/maintenance/:maintenanceId
 */
export const getById = async (
  request: FastifyRequest<{ Params: MaintenanceIdParams }>,
  reply: FastifyReply
) => {
  const maintenance = await maintenanceService.getMaintenanceById(request.params.maintenanceId)

  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, maintenance))
}

/**
 * Preview affected reservations before creating maintenance
 * POST /products/:id/maintenance/preview
 */
export const previewAffected = async (
  request: FastifyRequest<{ Params: ProductIdParams; Body: CreateMaintenanceBody }>,
  reply: FastifyReply
) => {
  const startDate = new Date(request.body.startDate)
  startDate.setUTCHours(0, 0, 0, 0)

  const endDate = request.body.endDate
    ? new Date(request.body.endDate)
    : null
  if (endDate) {
    endDate.setUTCHours(0, 0, 0, 0)
  }

  // Check for overlap
  const overlapCheck = await maintenanceService.checkMaintenanceOverlap(
    request.params.id,
    startDate,
    endDate
  )

  // Get affected reservations
  const affectedReservations = await maintenanceService.getAffectedReservations(
    request.params.id,
    startDate,
    endDate
  )

  // Calculate total credits to refund
  const totalCreditsToRefund = affectedReservations.reduce(
    (sum, r) => sum + r.creditsCharged,
    0
  )

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, {
      hasOverlap: overlapCheck.hasOverlap,
      overlappingMaintenance: overlapCheck.overlappingMaintenance,
      affectedReservations: affectedReservations.map((r) => ({
        id: r.id,
        startDate: r.startDate,
        endDate: r.endDate,
        creditsCharged: r.creditsCharged,
        user: {
          id: r.user.id,
          firstName: r.user.firstName,
          lastName: r.user.lastName,
          email: r.user.email,
        },
      })),
      totalReservationsAffected: affectedReservations.length,
      totalCreditsToRefund,
    })
  )
}
