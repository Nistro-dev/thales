// src/controllers/section.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as sectionService from '../services/section.service.js'
import * as subSectionService from '../services/subsection.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import type {
  CreateSectionInput,
  UpdateSectionInput,
  CreateSubSectionInput,
  UpdateSubSectionInput,
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
