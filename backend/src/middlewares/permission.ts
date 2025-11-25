import { FastifyRequest, FastifyReply } from 'fastify'
import { hasPermission, hasAllPermissions, hasAnyPermission } from '../services/permission.service.js'
import { ErrorMessages } from '../utils/response.js'
import type { PermissionKey } from '../constants/permissions.js'

/**
 * Middleware to check if user has a specific permission
 */
export const requirePermission = (permission: PermissionKey, sectionId?: string) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user?.userId) {
      throw {
        statusCode: 401,
        message: ErrorMessages.UNAUTHORIZED,
        code: 'UNAUTHORIZED',
      }
    }

    const allowed = await hasPermission(
      request.user.userId,
      permission,
      sectionId || (request.params as any)?.['sectionId'] as string
    )

    if (!allowed) {
      throw {
        statusCode: 403,
        message: ErrorMessages.FORBIDDEN,
        code: 'FORBIDDEN',
        details: { requiredPermission: permission },
      }
    }
  }
}

/**
 * Middleware to check if user has ALL of the specified permissions
 */
export const requireAllPermissions = (permissions: PermissionKey[], sectionId?: string) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user?.userId) {
      throw {
        statusCode: 401,
        message: ErrorMessages.UNAUTHORIZED,
        code: 'UNAUTHORIZED',
      }
    }

    const allowed = await hasAllPermissions(
      request.user.userId,
      permissions,
      sectionId || (request.params as any)?.['sectionId'] as string
    )

    if (!allowed) {
      throw {
        statusCode: 403,
        message: ErrorMessages.FORBIDDEN,
        code: 'FORBIDDEN',
        details: { requiredPermissions: permissions },
      }
    }
  }
}

/**
 * Middleware to check if user has ANY of the specified permissions
 */
export const requireAnyPermission = (permissions: PermissionKey[], sectionId?: string) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user?.userId) {
      throw {
        statusCode: 401,
        message: ErrorMessages.UNAUTHORIZED,
        code: 'UNAUTHORIZED',
      }
    }

    const allowed = await hasAnyPermission(
      request.user.userId,
      permissions,
      sectionId || (request.params as any)?.['sectionId'] as string
    )

    if (!allowed) {
      throw {
        statusCode: 403,
        message: ErrorMessages.FORBIDDEN,
        code: 'FORBIDDEN',
        details: { requiredPermissions: permissions },
      }
    }
  }
}
