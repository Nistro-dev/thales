import { FastifyRequest, FastifyReply } from 'fastify'
import * as invitationService from '../services/invitation.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import type { CreateInvitationInput, CompleteRegistrationInput } from '../schemas/invitation.js'

export const createInvitation = async (
  request: FastifyRequest<{ Body: CreateInvitationInput }>,
  reply: FastifyReply
) => {
  const result = await invitationService.createInvitation(
    request.body.email,
    request.user.userId
  )

  return reply.status(201).send(
    createSuccessResponse(SuccessMessages.INVITATION_CREATED, {
      invitation: result,
    })
  )
}

export const validateToken = async (
  request: FastifyRequest<{ Querystring: { token: string } }>,
  reply: FastifyReply
) => {
  const result = await invitationService.validateInvitationToken(request.query.token)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, result)
  )
}

export const completeRegistration = async (
  request: FastifyRequest<{ Body: CompleteRegistrationInput }>,
  reply: FastifyReply
) => {
  const user = await invitationService.completeRegistration(request.body.token, {
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    password: request.body.password,
    gdprConsent: request.body.gdprConsent,
  })

  return reply.status(201).send(
    createSuccessResponse(SuccessMessages.REGISTRATION_COMPLETED, {
      user,
    })
  )
}

export const listPending = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const invitations = await invitationService.listPendingInvitations()

  return reply.send(
    createSuccessResponse(SuccessMessages.INVITATIONS_RETRIEVED, {
      invitations,
    })
  )
}

export const cancel = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  await invitationService.cancelInvitation(request.params.id)

  return reply.send(
    createSuccessResponse(SuccessMessages.INVITATION_CANCELLED, {})
  )
}
