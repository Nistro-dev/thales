import { get, patch, del, put } from "./client";
import type {
  NotificationPreferenceItem,
  NotificationType as NotificationTypeFromTypes,
} from "@/types";

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
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

export interface UnreadCountResponse {
  count: number;
}

export interface MarkAllAsReadResponse {
  count: number;
}

export interface DeleteAllResponse {
  count: number;
}

export const notificationsApi = {
  // List user notifications
  list: (limit = 50, offset = 0) =>
    get<NotificationsResponse>("/notifications", { limit, offset }),

  // Get unread count
  getUnreadCount: () => get<UnreadCountResponse>("/notifications/unread-count"),

  // Mark single notification as read
  markAsRead: (id: string) => patch<null>(`/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: () => patch<MarkAllAsReadResponse>("/notifications/read-all"),

  // Delete notification
  delete: (id: string) => del<null>(`/notifications/${id}`),

  // Delete all notifications
  deleteAll: () => del<DeleteAllResponse>("/notifications/all"),
};

// Notification Preferences API
// Backend returns array directly in data field
export type NotificationPreferencesResponse = NotificationPreferenceItem[];

export interface UpdatePreferenceInput {
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export interface BulkUpdatePreferenceInput {
  notificationType: NotificationTypeFromTypes;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export const notificationPreferencesApi = {
  // Get all notification preferences
  getPreferences: () =>
    get<NotificationPreferencesResponse>("/notifications/preferences"),

  // Update a single notification preference
  updatePreference: (
    type: NotificationTypeFromTypes,
    data: UpdatePreferenceInput,
  ) =>
    patch<NotificationPreferenceItem>(
      `/notifications/preferences/${type}`,
      data,
    ),

  // Update multiple notification preferences at once
  updatePreferences: (preferences: BulkUpdatePreferenceInput[]) =>
    put<{ preferences: NotificationPreferenceItem[] }>(
      "/notifications/preferences",
      { preferences },
    ),
};
