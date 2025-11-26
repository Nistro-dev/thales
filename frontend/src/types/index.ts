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
  allowedDaysIn: number[]
  allowedDaysOut: number[]
  sortOrder: number
  isSystem: boolean
  subSections?: SubSection[]
  createdAt: string
  updatedAt: string
}

export interface SubSection {
  id: string
  name: string
  description: string | null
  sectionId: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// Product Types
export type ProductStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE' | 'ARCHIVED'
export type ProductCondition = 'OK' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE' | 'MISSING_PARTS' | 'BROKEN'
export type FileVisibility = 'PUBLIC' | 'ADMIN'

export interface ProductAttribute {
  id: string
  productId: string
  key: string
  value: string
  createdAt: string
  updatedAt: string
}

export interface ProductFile {
  id: string
  productId: string
  filename: string
  mimeType: string
  size: number
  s3Key: string
  visibility: FileVisibility
  sortOrder: number
  createdAt: string
  url?: string // Signed S3 URL
}

export interface Product {
  id: string
  name: string
  description: string | null
  reference: string | null
  priceCredits: number | null // null if user caution not validated
  minDuration: number
  maxDuration: number
  status: ProductStatus
  lastCondition?: ProductCondition
  lastMovementAt?: string | null
  sectionId: string
  section: {
    id: string
    name: string
    allowedDaysIn?: number[]
    allowedDaysOut?: number[]
  }
  subSectionId: string | null
  subSection?: {
    id: string
    name: string
  } | null
  attributes?: ProductAttribute[]
  files?: ProductFile[]
  thumbnail?: {
    id: string
    s3Key: string
    mimeType: string
    url?: string
  } | null
  createdAt: string
  updatedAt: string
}

// Product Query Filters
export interface ProductFilters {
  search?: string
  sectionId?: string
  subSectionId?: string
  status?: ProductStatus
  minPrice?: number
  maxPrice?: number
  sortBy?: 'createdAt' | 'name' | 'priceCredits'
  sortOrder?: 'asc' | 'desc'
  includeArchived?: boolean
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
