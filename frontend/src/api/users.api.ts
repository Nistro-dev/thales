import { get, post, put, patch, del } from "./client";
import type { User } from "@/types";

// ============================================
// TYPES
// ============================================

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";
export type CautionStatus = "PENDING" | "VALIDATED" | "EXEMPTED";
export type CreditTransactionType =
  | "INITIAL"
  | "ADJUSTMENT"
  | "RESERVATION"
  | "REFUND"
  | "EXTENSION";

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  amount: number;
  balanceAfter: number;
  type: CreditTransactionType | string;
  reason?: string;
  performedBy?: string;
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  reservationId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreditTransactionsData {
  transactions: CreditTransaction[];
}

// Admin Types
export interface UserRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions?: string[];
}

// User role assignment (from backend - nested structure)
export interface UserRoleAssignment {
  userId: string;
  roleId: string;
  sectionId: string | null;
  createdAt: string;
  role: UserRole;
  section: { id: string; name: string } | null;
}

export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  creditBalance: number;
  cautionStatus: CautionStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDetail extends UserListItem {
  gdprConsentAt: string | null;
  gdprVersion: string | null;
  roles: UserRoleAssignment[];
}

export interface UserFilters {
  status?: UserStatus;
  cautionStatus?: CautionStatus;
  search?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | undefined;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface AdjustCreditsInput {
  amount: number;
  reason?: string;
}

export interface UserReservation {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    reference: string | null;
  };
  startDate: string;
  endDate: string;
  status: string;
  creditsCharged: number;
  createdAt: string;
}

// ============================================
// USER API (Current User)
// ============================================

export const usersApi = {
  // Get current user profile (using existing auth/me endpoint)
  getProfile: () => get<{ user: User }>("/auth/me"),

  // Update current user's profile
  updateProfile: (data: UpdateProfileInput) =>
    patch<{ user: User }>("/users/me", data),

  // Change password - requires backend endpoint to be added
  changePassword: (data: ChangePasswordInput) =>
    post<Record<string, never>>("/auth/change-password", data),

  // Get current user's credit transactions (no special permission required)
  getMyCreditTransactions: (page = 1, limit = 20) =>
    get<CreditTransactionsData>("/users/me/credits/transactions", {
      page,
      limit,
    }),

  // Get credit transactions for a specific user (requires VIEW_CREDITS permission)
  getCreditTransactions: (userId: string, page = 1, limit = 20) =>
    get<CreditTransactionsData>(`/users/${userId}/credits/transactions`, {
      page,
      limit,
    }),
};

// ============================================
// ADMIN USERS API
// ============================================

export const adminUsersApi = {
  // List users with filters and pagination
  getUsers: (params?: UserFilters) =>
    get<{ users: UserListItem[] }>("/users", params),

  // Get user details
  getUser: (id: string) => get<{ user: UserDetail }>(`/users/${id}`),

  // Create user (admin)
  createUser: (data: CreateUserInput) =>
    post<{ user: UserListItem }>("/users", data),

  // Update user
  updateUser: (id: string, data: UpdateUserInput) =>
    put<{ user: UserDetail }>(`/users/${id}`, data),

  // Update user status (suspend/activate/disable)
  updateUserStatus: (id: string, status: UserStatus) =>
    patch<{ user: UserDetail }>(`/users/${id}/status`, { status }),

  // Delete user (soft delete - sets status to DISABLED)
  deleteUser: (id: string) => del<{ user: UserDetail }>(`/users/${id}`),

  // Adjust user credits
  adjustCredits: (id: string, data: AdjustCreditsInput) =>
    post<{
      user: { id: string; creditBalance: number };
      transaction: CreditTransaction;
    }>(`/users/${id}/credits/adjust`, data),

  // Get user reservations (via admin reservations endpoint with userId filter)
  // Note: backend returns reservations directly in data, not nested in { reservations: [] }
  getUserReservations: (
    userId: string,
    params?: { page?: number; limit?: number },
  ) => get<UserReservation[]>("/admin/reservations", { userId, ...params }),

  // Caution management
  validateCaution: (id: string) =>
    post<{ user: UserDetail }>(`/users/${id}/caution/validate`),

  exemptCaution: (id: string) =>
    post<{ user: UserDetail }>(`/users/${id}/caution/exempt`),

  resetCaution: (id: string) =>
    post<{ user: UserDetail }>(`/users/${id}/caution/reset`),

  // Role management
  assignRole: (userId: string, roleId: string) =>
    post<{ user: UserDetail }>(`/roles/users/${userId}/assign`, { roleId }),

  revokeRole: (userId: string, roleId: string) =>
    post<{ user: UserDetail }>(`/roles/users/${userId}/revoke`, { roleId }),

  getUserRoles: (userId: string) =>
    get<{ roles: UserRole[] }>(`/roles/users/${userId}/roles`),

  // Disable user
  disableUser: (id: string) =>
    post<{ user: UserDetail }>(`/users/${id}/disable`),

  // Reactivate user
  reactivateUser: (id: string) =>
    post<{ user: UserDetail }>(`/users/${id}/reactivate`),
};

// ============================================
// ROLES API
// ============================================

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export const rolesApi = {
  // Get all roles
  getRoles: () => get<{ roles: Role[] }>("/roles"),

  // Get role by ID
  getRole: (id: string) => get<{ role: Role }>(`/roles/${id}`),

  // Get all permissions
  getAllPermissions: () =>
    get<{ permissions: Record<string, string[]> }>("/roles/permissions"),
};

// ============================================
// INVITATIONS API
// ============================================

export interface Invitation {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const invitationsApi = {
  // Create invitation (admin)
  create: (email: string) =>
    post<{ invitation: Invitation }>("/invitations", { email }),

  // List pending invitations (admin)
  listPending: () => get<{ invitations: Invitation[] }>("/invitations/pending"),

  // Cancel invitation (admin)
  cancel: (id: string) => del<Record<string, never>>(`/invitations/${id}`),

  // Validate token (public - for register page)
  validateToken: (token: string) =>
    get<{ email: string; valid: boolean }>("/invitations/validate", { token }),

  // Complete registration (public)
  completeRegistration: (data: {
    token: string;
    firstName: string;
    lastName: string;
    password: string;
    gdprConsent: boolean;
  }) => post<{ user: UserListItem }>("/invitations/complete", data),
};
