import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { logger } from '../utils/logger.js'
import { createErrorResponse, ErrorMessages } from '../utils/response.js'
import type { AppError, ErrorCode } from '../types/api.js'

export const errorHandler = (
  error: FastifyError & Partial<AppError>,
  request: FastifyRequest,
  reply: FastifyReply
): void => {
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    },
    'Request error'
  )

  // Zod validation errors
  if (error instanceof ZodError) {
    const details: Record<string, string> = {}
    error.errors.forEach((e) => {
      const field = e.path.join('.')
      details[field] = e.message
    })

    reply.status(400).send(
      createErrorResponse(
        ErrorMessages.VALIDATION_ERROR,
        'VALIDATION_ERROR',
        details
      )
    )
    return
  }

  // Application errors with custom error code
  if (error.code && error.statusCode) {
    reply.status(error.statusCode).send(
      createErrorResponse(
        error.message,
        error.code as ErrorCode,
        error.details
      )
    )
    return
  }

  // Generic errors with statusCode
  if (error.statusCode) {
    const code = getErrorCodeFromStatus(error.statusCode)
    reply.status(error.statusCode).send(
      createErrorResponse(error.message, code)
    )
    return
  }

  // Fallback: Internal server error
  reply.status(500).send(
    createErrorResponse(
      ErrorMessages.INTERNAL_ERROR,
      'INTERNAL_ERROR'
    )
  )
}

/**
 * Mappe les status HTTP aux codes d'erreur
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'ALREADY_EXISTS'
    case 503:
      return 'SERVICE_UNAVAILABLE'
    default:
      return 'INTERNAL_ERROR'
  }
}
