import { Permission } from '@/constants/permissions'

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// User & Auth Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  credits: number
  cautionPaid: boolean
  roles: Role[]
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: Permission[]
  createdAt: string
  updatedAt: string
}

// Section Types
export interface Section {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface SubSection {
  id: string
  name: string
  description: string | null
  sectionId: string
  section: Section
  createdAt: string
  updatedAt: string
}

// Product Types
export interface Product {
  id: string
  name: string
  description: string | null
  quantity: number
  availableQuantity: number
  price: number
  imageKey: string | null
  imageUrl?: string
  subSectionId: string
  subSection: SubSection
  createdAt: string
  updatedAt: string
}

// Reservation Types
export type ReservationStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE'

export interface Reservation {
  id: string
  userId: string
  user: User
  productId: string
  product: Product
  quantity: number
  startDate: string
  endDate: string
  status: ReservationStatus
  totalCost: number
  totalExtensionCost: number
  extensionCount: number
  createdAt: string
  updatedAt: string
}

// Notification Types
export type NotificationType =
  | 'RESERVATION_CREATED'
  | 'RESERVATION_CONFIRMED'
  | 'RESERVATION_CANCELLED'
  | 'RESERVATION_EXTENSION_REQUESTED'
  | 'RESERVATION_EXTENSION_APPROVED'
  | 'RESERVATION_EXTENSION_REJECTED'
  | 'RESERVATION_REMINDER'
  | 'RESERVATION_OVERDUE'
  | 'CREDITS_UPDATED'
  | 'SYSTEM'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
}
