import { get, post, put, del } from './client'
import type { Permission } from '@/constants/permissions'

// Types
export interface RolePermission {
  id: string
  key: string
  name: string
  description: string | null
  category: string
}

export interface RoleUser {
  id: string
  email: string
  firstName: string
  lastName: string
  sectionId: string | null
  section?: {
    id: string
    name: string
  } | null
}

export interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
  userCount?: number
  createdAt: string
  updatedAt: string
}

export interface RoleDetail extends Role {
  users: RoleUser[]
}

export interface PermissionItem {
  id: string
  key: string
  name: string
  description: string | null
  category: string
  parentId: string | null
  children?: PermissionItem[]
}

export interface UserRole {
  roleId: string
  sectionId: string | null
  role: Role
  section?: {
    id: string
    name: string
  } | null
}

// Request types
export interface CreateRoleRequest {
  name: string
  description?: string
  permissionKeys: string[]
}

export interface UpdateRoleRequest {
  name?: string
  description?: string
  permissionKeys?: string[]
}

export interface AssignRoleRequest {
  roleId: string
  sectionId?: string
}

export interface RevokeRoleRequest {
  roleId: string
}

// Raw API response types (what the backend actually returns)
interface RawRolePermission {
  roleId: string
  permissionId: string
  createdAt: string
  permission: {
    id: string
    key: string
    name: string
    description: string | null
    category: string
    parentId: string | null
    createdAt: string
  }
}

interface RawRole {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  createdAt: string
  updatedAt: string
  permissions: RawRolePermission[]
  users: { userId: string }[]
}

interface RawRoleUser {
  userId: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
  section?: {
    id: string
    name: string
  } | null
}

interface RawRoleDetail extends Omit<RawRole, 'users'> {
  users: RawRoleUser[]
}

// Transform raw role to our Role type
function transformRole(raw: RawRole): Role {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isSystem: raw.isSystem,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    permissions: raw.permissions.map((p) => p.permission.key as Permission),
    userCount: raw.users.length,
  }
}

function transformRoleDetail(raw: RawRoleDetail): RoleDetail {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    isSystem: raw.isSystem,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    permissions: raw.permissions.map((p) => p.permission.key as Permission),
    userCount: raw.users.length,
    users: raw.users.map((u) => ({
      id: u.user.id,
      email: u.user.email,
      firstName: u.user.firstName,
      lastName: u.user.lastName,
      sectionId: u.section?.id ?? null,
      section: u.section,
    })),
  }
}

// API functions
export const rolesApi = {
  // Get all roles
  getRoles: async (includeSystem = true) => {
    const response = await get<{ roles: RawRole[] }>('/roles', { includeSystem })
    const roles = response.data?.roles ?? []
    return roles.map(transformRole)
  },

  // Get role by ID
  getRole: async (id: string) => {
    const response = await get<{ role: RawRoleDetail }>(`/roles/${id}`)
    if (!response.data?.role) return undefined
    return transformRoleDetail(response.data.role)
  },

  // Create role
  createRole: async (data: CreateRoleRequest) => {
    const response = await post<Role>('/roles', data)
    return response.data
  },

  // Update role
  updateRole: async (id: string, data: UpdateRoleRequest) => {
    const response = await put<Role>(`/roles/${id}`, data)
    return response.data
  },

  // Delete role
  deleteRole: async (id: string) => {
    const response = await del<void>(`/roles/${id}`)
    return response
  },

  // Assign role to user
  assignRole: async (userId: string, data: AssignRoleRequest) => {
    const response = await post<void>(`/roles/users/${userId}/assign`, data)
    return response
  },

  // Revoke role from user
  revokeRole: async (userId: string, data: RevokeRoleRequest) => {
    const response = await post<void>(`/roles/users/${userId}/revoke`, data)
    return response
  },

  // Get user's roles
  getUserRoles: async (userId: string) => {
    const response = await get<UserRole[]>(`/roles/users/${userId}/roles`)
    return response.data ?? []
  },

  // Get all permissions
  getPermissions: async () => {
    const response = await get<{ permissions: PermissionItem[] }>('/roles/permissions')
    return response.data?.permissions ?? []
  },

  // Get permissions by category
  getPermissionsByCategory: async (category: string) => {
    const response = await get<{ permissions: PermissionItem[] }>(`/roles/permissions/${category}`)
    return response.data?.permissions ?? []
  },
}
