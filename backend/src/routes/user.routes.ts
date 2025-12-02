import { FastifyInstance } from 'fastify'
import * as userController from '../controllers/user.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export default async function userRoutes(fastify: FastifyInstance) {
  // IMPORTANT: All /me routes must be before /:id routes to avoid "me" being parsed as an ID

  // Update current user's profile (no special permission, just auth)
  fastify.patch(
    '/me',
    {
      onRequest: [authMiddleware],
    },
    userController.updateMyProfile
  )

  // Get current user's credit transactions (no special permission, just auth)
  fastify.get(
    '/me/credits/transactions',
    {
      onRequest: [authMiddleware],
    },
    userController.getMyCreditTransactions
  )

  // Get all users (with filters)
  fastify.get(
    '/',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_USERS)],
    },
    userController.getUsers
  )

  // Create user
  fastify.post(
    '/',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS)],
    },
    userController.createUser
  )

  // Get user by ID
  fastify.get(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_USERS)],
    },
    userController.getUserById
  )

  // Update user
  fastify.put(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS)],
    },
    userController.updateUser
  )

  // Delete user
  fastify.delete(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS)],
    },
    userController.deleteUser
  )

  // Change user status
  fastify.patch(
    '/:id/status',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS)],
    },
    userController.changeUserStatus
  )

  // Validate caution
  fastify.post(
    '/:id/caution/validate',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_CAUTIONS)],
    },
    userController.validateCaution
  )

  // Exempt caution
  fastify.post(
    '/:id/caution/exempt',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_CAUTIONS)],
    },
    userController.exemptCaution
  )

  // Reset caution
  fastify.post(
    '/:id/caution/reset',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_CAUTIONS)],
    },
    userController.resetCaution
  )

  // Adjust credits
  fastify.post(
    '/:id/credits/adjust',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_CREDITS)],
    },
    userController.adjustCredits
  )

  // Get credit transactions
  fastify.get(
    '/:id/credits/transactions',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_CREDITS)],
    },
    userController.getCreditTransactions
  )

  // Disable user
  fastify.post(
    '/:id/disable',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS)],
    },
    userController.disableUser
  )

  // Reactivate user
  fastify.post(
    '/:id/reactivate',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.MANAGE_USERS)],
    },
    userController.reactivateUser
  )
}
