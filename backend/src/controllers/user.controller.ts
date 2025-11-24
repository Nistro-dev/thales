import { FastifyRequest, FastifyReply } from 'fastify'
import * as userService from '../services/user.service.js'
import * as creditService from '../services/credit.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import {
  createUserSchema,
  updateUserSchema,
  changeUserStatusSchema,
  getUsersQuerySchema,
  userIdParamSchema,
  adjustCreditsSchema,
  getCreditTransactionsQuerySchema,
} from '../schemas/user.js'

export const createUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const body = createUserSchema.parse(request.body)
  const user = await userService.createUser({
    ...body,
    performedBy: request.user.userId,
  })

  return reply.status(201).send(
    createSuccessResponse(SuccessMessages.USER_CREATED, { user })
  )
}

export const getUsers = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const query = getUsersQuerySchema.parse(request.query)
  const result = await userService.getUsers(query)

  return reply.send(
    createSuccessResponse(
      SuccessMessages.USERS_RETRIEVED,
      { users: result.users },
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      }
    )
  )
}

export const getUserById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const user = await userService.getUserById(params.id)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, { user })
  )
}

export const updateUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const body = updateUserSchema.parse(request.body)
  const user = await userService.updateUser({
    userId: params.id,
    ...body,
    performedBy: request.user.userId,
  })

  return reply.send(
    createSuccessResponse(SuccessMessages.USER_UPDATED, { user })
  )
}

export const deleteUser = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const user = await userService.deleteUser(params.id, request.user.userId)

  return reply.send(
    createSuccessResponse(SuccessMessages.USER_DELETED, { user })
  )
}

export const changeUserStatus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const body = changeUserStatusSchema.parse(request.body)
  const user = await userService.changeUserStatus(
    params.id,
    body.status,
    request.user.userId
  )

  return reply.send(
    createSuccessResponse(SuccessMessages.USER_STATUS_CHANGED, { user })
  )
}

export const validateCaution = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const user = await userService.validateCaution(
    params.id,
    request.user.userId
  )

  return reply.send(
    createSuccessResponse(SuccessMessages.CAUTION_VALIDATED, { user })
  )
}

export const exemptCaution = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const user = await userService.exemptCaution(
    params.id,
    request.user.userId
  )

  return reply.send(
    createSuccessResponse(SuccessMessages.CAUTION_EXEMPTED, { user })
  )
}

export const resetCaution = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const user = await userService.resetCaution(
    params.id,
    request.user.userId
  )

  return reply.send(
    createSuccessResponse(SuccessMessages.CAUTION_RESET, { user })
  )
}

export const adjustCredits = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const body = adjustCreditsSchema.parse(request.body)
  const result = await creditService.adjustCredits({
    userId: params.id,
    amount: body.amount,
    reason: body.reason,
    performedBy: request.user.userId,
  })

  return reply.send(
    createSuccessResponse(SuccessMessages.CREDITS_ADJUSTED, {
      user: result.user,
      transaction: result.transaction,
    })
  )
}

export const getCreditTransactions = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const query = getCreditTransactionsQuerySchema.parse(request.query)
  const result = await creditService.getUserTransactions({
    userId: params.id,
    page: query.page,
    limit: query.limit,
  })

  return reply.send(
    createSuccessResponse(
      SuccessMessages.CREDIT_TRANSACTIONS_RETRIEVED,
      { transactions: result.transactions },
      {
        page: result.pagination.page,
        limit: result.pagination.limit,
        total: result.pagination.total,
      }
    )
  )
}
