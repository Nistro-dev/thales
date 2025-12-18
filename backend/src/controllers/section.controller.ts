// src/controllers/section.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as sectionService from '../services/section.service.js'
import * as subSectionService from '../services/subsection.service.js'
import * as closureService from '../services/section-closure.service.js'
import * as timeSlotService from '../services/time-slot.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import type {
  CreateSectionInput,
  UpdateSectionInput,
  CreateSubSectionInput,
  UpdateSubSectionInput,
  CreateClosureInput,
  UpdateClosureInput,
  CreateTimeSlotInput,
  UpdateTimeSlotInput,
} from '../schemas/section.js'

export const list = async (
  request: FastifyRequest<{ Querystring: { includeSystem?: string } }>,
  reply: FastifyReply
) => {
  const includeSystem = request.query.includeSystem === 'true'
  const sections = await sectionService.listSections(includeSystem)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, sections))
}

export const getById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const section = await sectionService.getSectionById(request.params.id)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, section))
}

export const create = async (
  request: FastifyRequest<{ Body: CreateSectionInput }>,
  reply: FastifyReply
) => {
  const section = await sectionService.createSection(request.body, request.user.userId, request)
  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, section))
}

export const update = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateSectionInput }>,
  reply: FastifyReply
) => {
  const section = await sectionService.updateSection(
    request.params.id,
    request.body,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, section))
}

export const remove = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  await sectionService.deleteSection(request.params.id, request.user.userId, request)
  return reply.send(createSuccessResponse(SuccessMessages.DELETED, null))
}

// SubSections

export const createSubSection = async (
  request: FastifyRequest<{ Params: { id: string }; Body: CreateSubSectionInput }>,
  reply: FastifyReply
) => {
  const subSection = await subSectionService.createSubSection(
    { ...request.body, sectionId: request.params.id },
    request.user.userId,
    request
  )
  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, subSection))
}

export const listOrphanSubSections = async (_request: FastifyRequest, reply: FastifyReply) => {
  const subSections = await subSectionService.listOrphanSubSections()
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, subSections))
}

export const getSubSectionById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const subSection = await subSectionService.getSubSectionById(request.params.id)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, subSection))
}

export const updateSubSection = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateSubSectionInput }>,
  reply: FastifyReply
) => {
  const subSection = await subSectionService.updateSubSection(
    request.params.id,
    request.body,
    request.user.userId,
    request
  )
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, subSection))
}

export const removeSubSection = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  await subSectionService.deleteSubSection(request.params.id, request.user.userId, request)
  return reply.send(createSuccessResponse(SuccessMessages.DELETED, null))
}

// ============================================
// CLOSURES
// ============================================

export const listClosures = async (
  request: FastifyRequest<{
    Params: { id: string }
    Querystring: { includeExpired?: string }
  }>,
  reply: FastifyReply
) => {
  const includeExpired = request.query.includeExpired !== 'false'
  const closures = await closureService.listClosures({
    sectionId: request.params.id,
    includeExpired,
  })
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, closures))
}

export const getClosureById = async (
  request: FastifyRequest<{ Params: { closureId: string } }>,
  reply: FastifyReply
) => {
  const closure = await closureService.getClosureById(request.params.closureId)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, closure))
}

export const createClosure = async (
  request: FastifyRequest<{ Params: { id: string }; Body: CreateClosureInput }>,
  reply: FastifyReply
) => {
  const result = await closureService.createClosure({
    sectionId: request.params.id,
    ...request.body,
    adminId: request.user.userId,
  })
  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, result))
}

export const updateClosure = async (
  request: FastifyRequest<{ Params: { closureId: string }; Body: UpdateClosureInput }>,
  reply: FastifyReply
) => {
  const result = await closureService.updateClosure({
    closureId: request.params.closureId,
    ...request.body,
    adminId: request.user.userId,
  })
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, result))
}

export const deleteClosure = async (
  request: FastifyRequest<{ Params: { closureId: string } }>,
  reply: FastifyReply
) => {
  await closureService.deleteClosure({
    closureId: request.params.closureId,
    adminId: request.user.userId,
  })
  return reply.send(createSuccessResponse(SuccessMessages.DELETED, null))
}

export const getCurrentClosure = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const closure = await closureService.getCurrentClosure(request.params.id)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, closure))
}

// ============================================
// TIME SLOTS
// ============================================

export const listTimeSlots = async (
  request: FastifyRequest<{
    Params: { id: string }
    Querystring: { type?: 'CHECKOUT' | 'RETURN' }
  }>,
  reply: FastifyReply
) => {
  const timeSlots = await timeSlotService.listTimeSlots({
    sectionId: request.params.id,
    type: request.query.type,
  })
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, timeSlots))
}

export const getTimeSlotById = async (
  request: FastifyRequest<{ Params: { slotId: string } }>,
  reply: FastifyReply
) => {
  const timeSlot = await timeSlotService.getTimeSlotById(request.params.slotId)
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, timeSlot))
}

export const createTimeSlot = async (
  request: FastifyRequest<{ Params: { id: string }; Body: CreateTimeSlotInput }>,
  reply: FastifyReply
) => {
  const timeSlot = await timeSlotService.createTimeSlot({
    sectionId: request.params.id,
    ...request.body,
    adminId: request.user.userId,
  })
  return reply.status(201).send(createSuccessResponse(SuccessMessages.CREATED, timeSlot))
}

export const updateTimeSlot = async (
  request: FastifyRequest<{ Params: { slotId: string }; Body: UpdateTimeSlotInput }>,
  reply: FastifyReply
) => {
  const timeSlot = await timeSlotService.updateTimeSlot({
    timeSlotId: request.params.slotId,
    ...request.body,
    adminId: request.user.userId,
  })
  return reply.send(createSuccessResponse(SuccessMessages.UPDATED, timeSlot))
}

export const deleteTimeSlot = async (
  request: FastifyRequest<{ Params: { slotId: string } }>,
  reply: FastifyReply
) => {
  await timeSlotService.deleteTimeSlot({
    timeSlotId: request.params.slotId,
    adminId: request.user.userId,
  })
  return reply.send(createSuccessResponse(SuccessMessages.DELETED, null))
}

export const getTimeSlotsGroupedByDay = async (
  request: FastifyRequest<{
    Params: { id: string }
    Querystring: { type?: 'CHECKOUT' | 'RETURN' }
  }>,
  reply: FastifyReply
) => {
  const grouped = await timeSlotService.getTimeSlotsGroupedByDay(
    request.params.id,
    request.query.type
  )
  return reply.send(createSuccessResponse(SuccessMessages.RETRIEVED, grouped))
}
