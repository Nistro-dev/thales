import { FastifyRequest, FastifyReply } from 'fastify'
import * as roleService from '../services/role.service.js'
import * as permissionService from '../services/permission.service.js'
import { createSuccessResponse, SuccessMessages } from '../utils/response.js'
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
  assignRoleSchema,
  revokeRoleSchema,
  getRolesQuerySchema,
} from '../schemas/role.js'
import { userIdParamSchema } from '../schemas/user.js'

export const createRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const body = createRoleSchema.parse(request.body)
  const role = await roleService.createRole({
    ...body,
    performedBy: request.user.userId,
  })

  return reply.status(201).send(
    createSuccessResponse(SuccessMessages.ROLE_CREATED, { role })
  )
}

export const getRoles = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const query = getRolesQuerySchema.parse(request.query)
  const roles = await roleService.getRoles(query.includeSystem)

  return reply.send(
    createSuccessResponse(SuccessMessages.ROLES_RETRIEVED, { roles })
  )
}

export const getRoleById = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = roleIdParamSchema.parse(request.params)
  const role = await roleService.getRoleById(params.id)

  return reply.send(
    createSuccessResponse(SuccessMessages.RETRIEVED, { role })
  )
}

export const updateRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = roleIdParamSchema.parse(request.params)
  const body = updateRoleSchema.parse(request.body)
  const role = await roleService.updateRole({
    roleId: params.id,
    ...body,
    performedBy: request.user.userId,
  })

  return reply.send(
    createSuccessResponse(SuccessMessages.ROLE_UPDATED, { role })
  )
}

export const deleteRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = roleIdParamSchema.parse(request.params)
  await roleService.deleteRole(params.id, request.user.userId)

  return reply.send(
    createSuccessResponse(SuccessMessages.ROLE_DELETED, {})
  )
}

export const assignRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const body = assignRoleSchema.parse(request.body)
  const userRole = await roleService.assignRole({
    userId: params.id,
    roleId: body.roleId,
    sectionId: body.sectionId,
    performedBy: request.user.userId,
  })

  return reply.send(
    createSuccessResponse(SuccessMessages.ROLE_ASSIGNED, { userRole })
  )
}

export const revokeRole = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const body = revokeRoleSchema.parse(request.body)
  await roleService.revokeRole({
    userId: params.id,
    roleId: body.roleId,
    performedBy: request.user.userId,
  })

  return reply.send(
    createSuccessResponse(SuccessMessages.ROLE_REVOKED, {})
  )
}

export const getUserRoles = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = userIdParamSchema.parse(request.params)
  const roles = await roleService.getUserRoles(params.id)

  return reply.send(
    createSuccessResponse(SuccessMessages.USER_ROLES_RETRIEVED, { roles })
  )
}

export const getAllPermissions = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  const permissions = await permissionService.getAllPermissions()

  return reply.send(
    createSuccessResponse(SuccessMessages.PERMISSIONS_RETRIEVED, { permissions })
  )
}

export const getPermissionsByCategory = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const params = request.params as { category: string }
  const permissions = await permissionService.getPermissionsByCategory(
    params.category
  )

  return reply.send(
    createSuccessResponse(SuccessMessages.PERMISSIONS_RETRIEVED, { permissions })
  )
}
