import { FastifyInstance } from 'fastify'
import * as roleController from '../controllers/role.controller.js'
import { authMiddleware } from '../middlewares/auth.js'
import { requirePermission } from '../middlewares/permission.js'
import { PERMISSIONS } from '../constants/permissions.js'

export default async function roleRoutes(fastify: FastifyInstance) {
  // Get all roles
  fastify.get(
    '/',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_ROLES)],
    },
    roleController.getRoles
  )

  // Create role
  fastify.post(
    '/',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.CREATE_ROLES)],
    },
    roleController.createRole
  )

  // Get role by ID
  fastify.get(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_ROLES)],
    },
    roleController.getRoleById
  )

  // Update role
  fastify.put(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.UPDATE_ROLES)],
    },
    roleController.updateRole
  )

  // Delete role
  fastify.delete(
    '/:id',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.DELETE_ROLES)],
    },
    roleController.deleteRole
  )

  // Assign role to user
  fastify.post(
    '/users/:id/assign',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.ASSIGN_ROLES)],
    },
    roleController.assignRole
  )

  // Revoke role from user
  fastify.post(
    '/users/:id/revoke',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.ASSIGN_ROLES)],
    },
    roleController.revokeRole
  )

  // Get user roles
  fastify.get(
    '/users/:id/roles',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_ROLES)],
    },
    roleController.getUserRoles
  )

  // Get all permissions
  fastify.get(
    '/permissions',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_ROLES)],
    },
    roleController.getAllPermissions
  )

  // Get permissions by category
  fastify.get(
    '/permissions/:category',
    {
      onRequest: [authMiddleware, requirePermission(PERMISSIONS.VIEW_ROLES)],
    },
    roleController.getPermissionsByCategory
  )
}
