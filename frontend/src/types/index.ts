import { Permission } from "@/constants/permissions";

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    timestamp?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User & Auth Types
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  status?: UserStatus;
  credits: number;
  cautionPaid: boolean;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface RoleSection {
  roleId: string;
  sectionId: string;
  section: Section;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  sections?: RoleSection[];
  createdAt: string;
  updatedAt: string;
}

// Section Types
export interface Section {
  id: string;
  name: string;
  description: string | null;
  allowedDaysIn: number[];
  allowedDaysOut: number[];
  refundDeadlineHours: number;
  sortOrder: number;
  isSystem: boolean;
  subSections?: SubSection[];
  createdAt: string;
  updatedAt: string;
}

export interface SubSection {
  id: string;
  name: string;
  description: string | null;
  sectionId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SectionClosure {
  id: string;
  sectionId: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Time Slot Types
export type SlotType = "CHECKOUT" | "RETURN";

export interface TimeSlot {
  id: string;
  sectionId: string;
  type: SlotType;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTimeSlotInput {
  type: SlotType;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface UpdateTimeSlotInput {
  type?: SlotType;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
}

// Product Types
export type ProductStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "MAINTENANCE"
  | "ARCHIVED";
export type ProductCondition =
  | "OK"
  | "MINOR_DAMAGE"
  | "MAJOR_DAMAGE"
  | "MISSING_PARTS"
  | "BROKEN";
export type FileVisibility = "PUBLIC" | "ADMIN";
export type CreditPeriod = "DAY" | "WEEK";

export interface ProductAttribute {
  id: string;
  productId: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFile {
  id: string;
  productId: string;
  filename: string;
  mimeType: string;
  size: number;
  s3Key: string;
  visibility: FileVisibility;
  sortOrder: number;
  createdAt: string;
  url?: string; // Signed S3 URL
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  reference: string | null;
  priceCredits: number | null; // null if user caution not validated
  creditPeriod: CreditPeriod;
  minDuration: number;
  maxDuration: number;
  status: ProductStatus;
  lastCondition?: ProductCondition;
  lastMovementAt?: string | null;
  sectionId: string;
  section: {
    id: string;
    name: string;
    allowedDaysIn?: number[];
    allowedDaysOut?: number[];
    refundDeadlineHours?: number;
  };
  subSectionId: string | null;
  subSection?: {
    id: string;
    name: string;
  } | null;
  attributes?: ProductAttribute[];
  files?: ProductFile[];
  thumbnail?: {
    id: string;
    s3Key: string;
    mimeType: string;
    url?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

// Product Query Filters
export interface ProductFilters {
  search?: string;
  sectionId?: string;
  subSectionId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "createdAt" | "name" | "priceCredits";
  sortOrder?: "asc" | "desc";
  includeArchived?: boolean;
}

// Reservation Types
export type ReservationStatus =
  | "CONFIRMED"
  | "CHECKED_OUT"
  | "RETURNED"
  | "CANCELLED"
  | "REFUNDED";

export interface MovementPhoto {
  id: string;
  s3Key: string;
  filename: string;
  mimeType: string;
  size: number;
  sortOrder: number;
  caption?: string | null;
  url?: string;
}

export interface ReservationMovement {
  id: string;
  type: "CHECKOUT" | "RETURN" | "STATUS_CHANGE";
  condition?: ProductCondition | null;
  notes?: string | null;
  performedAt: string;
  performedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  photos?: MovementPhoto[];
}

export interface Reservation {
  id: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    creditBalance?: number;
  };
  productId: string;
  product?: Product;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  status: ReservationStatus;
  creditsCharged: number;
  notes?: string | null;
  adminNotes?: string | null;
  qrCode?: string | null;
  checkedOutAt?: string | null;
  checkedOutBy?: string | null;
  returnedAt?: string | null;
  returnedBy?: string | null;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  refundedAt?: string | null;
  refundedBy?: string | null;
  refundAmount?: number | null;
  penalizedAt?: string | null;
  penalizedBy?: string | null;
  penaltyAmount?: number | null;
  penaltyReason?: string | null;
  movements?: ReservationMovement[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationInput {
  productId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  userId?: string;
  productId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  overdue?: "checkouts" | "returns";
  sortBy?: "createdAt" | "startDate" | "endDate";
  sortOrder?: "asc" | "desc";
}

// Notification Types
export type NotificationType =
  | "RESERVATION_CONFIRMED"
  | "RESERVATION_CANCELLED"
  | "RESERVATION_REFUNDED"
  | "RESERVATION_CHECKOUT"
  | "RESERVATION_RETURN"
  | "RESERVATION_REMINDER"
  | "RESERVATION_EXTENDED"
  | "RESERVATION_OVERDUE"
  | "RESERVATION_EXPIRED"
  | "CREDIT_ADDED"
  | "CREDIT_REMOVED"
  | "PASSWORD_CHANGED"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Notification Preference Types
export interface NotificationPreferenceItem {
  notificationType: NotificationType;
  label: string;
  description: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export interface UpdateNotificationPreferenceInput {
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

// Product Availability Types
export interface ProductAvailability {
  productId: string;
  month: string;
  allowedDaysIn: number[];
  allowedDaysOut: number[];
  reservedDates: Array<{ date: string }>;
  closedDates?: Array<{ date: string; reason: string }>;
  maintenanceDates?: Array<{ date: string; reason: string | null }>;
  timeSlots?: {
    checkout: TimeSlot[];
    return: TimeSlot[];
  };
}
