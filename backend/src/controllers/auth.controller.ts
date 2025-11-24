import { FastifyRequest, FastifyReply } from 'fastify'
import * as authService from '../services/auth.service.js'
import * as passwordResetService from '../services/password-reset.service.js'
import { env } from '../config/env.js'
import { createSuccessResponse, SuccessMessages, ErrorMessages } from '../utils/response.js'
import type { LoginInput, ForgotPasswordInput, ResetPasswordInput } from '../schemas/auth.js'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
}

const setAuthCookies = (reply: FastifyReply, accessToken: string, refreshToken: string) => {
  reply.setCookie('accessToken', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60,
  })

  reply.setCookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    path: '/api/auth',
    maxAge: 7 * 24 * 60 * 60,
  })
}

const clearAuthCookies = (reply: FastifyReply) => {
  reply.clearCookie('accessToken', { path: '/' })
  reply.clearCookie('refreshToken', { path: '/api/auth' })
}

export const login = async (
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) => {
  const result = await authService.login(request.body)

  setAuthCookies(reply, result.tokens.accessToken, result.tokens.refreshToken)

  return reply.send(
    createSuccessResponse(SuccessMessages.LOGIN_SUCCESS, {
      user: result.user,
    })
  )
}

export const refresh = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const refreshToken = request.cookies.refreshToken

  if (!refreshToken) {
    throw {
      statusCode: 401,
      message: ErrorMessages.NO_REFRESH_TOKEN,
      code: 'UNAUTHORIZED',
    }
  }

  const tokens = await authService.refresh(refreshToken)

  setAuthCookies(reply, tokens.accessToken, tokens.refreshToken)

  return reply.send(
    createSuccessResponse(SuccessMessages.TOKEN_REFRESHED, {})
  )
}

export const logout = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const refreshToken = request.cookies.refreshToken

  if (refreshToken) {
    await authService.logout(refreshToken)
  }

  clearAuthCookies(reply)

  return reply.send(
    createSuccessResponse(SuccessMessages.LOGOUT_SUCCESS, {})
  )
}

export const logoutAll = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  await authService.logoutAll(request.user.userId)

  clearAuthCookies(reply)

  return reply.send(
    createSuccessResponse(SuccessMessages.LOGOUT_ALL_SUCCESS, {})
  )
}

export const getMe = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const user = await authService.getMe(request.user.userId)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, { user })
  )
}

export const forgotPassword = async (
  request: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply
) => {
  await passwordResetService.requestPasswordReset(request.body.email)

  return reply.send(
    createSuccessResponse(SuccessMessages.PASSWORD_RESET_REQUESTED, {})
  )
}

export const validateResetToken = async (
  request: FastifyRequest<{ Querystring: { token: string } }>,
  reply: FastifyReply
) => {
  const result = await passwordResetService.validateResetToken(request.query.token)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, result)
  )
}

export const resetPassword = async (
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply
) => {
  await passwordResetService.resetPassword(request.body.token, request.body.password)

  return reply.send(
    createSuccessResponse(SuccessMessages.PASSWORD_RESET_SUCCESS, {})
  )
}