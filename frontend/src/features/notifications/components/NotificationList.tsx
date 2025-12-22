import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCheck, Bell } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from "../hooks/useNotifications";
import type { Notification } from "@/api/notifications.api";

interface NotificationListProps {
  limit?: number;
  onNotificationClick?: (notification: Notification) => void;
  showMarkAllAsRead?: boolean;
  showActions?: boolean;
}

export function NotificationList({
  limit,
  onNotificationClick,
  showMarkAllAsRead = true,
  showActions = false,
}: NotificationListProps) {
  const { data, isLoading, error } = useNotifications(limit || 50, 0);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  // Track notifications being deleted to prevent double-clicks
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    onNotificationClick?.(notification);
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleDelete = (id: string) => {
    if (deletingIds.has(id)) return; // Already deleting

    setDeletingIds((prev) => new Set(prev).add(id));
    deleteNotification.mutate(id, {
      onSettled: () => {
        setDeletingIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      },
    });
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive text-center py-4">
        Erreur lors du chargement des notifications
      </p>
    );
  }

  if (!data || data.notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Bell className="h-8 w-8 mb-2" />
        <p className="text-sm">Aucune notification</p>
      </div>
    );
  }

  const displayedNotifications = limit
    ? data.notifications.slice(0, limit)
    : data.notifications;

  return (
    <div className="space-y-1">
      {showMarkAllAsRead && data.unreadCount > 0 && (
        <div className="flex justify-end px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="text-xs h-7"
          >
            {markAllAsRead.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <CheckCheck className="h-3 w-3 mr-1" />
            )}
            Tout marquer comme lu
          </Button>
        </div>
      )}
      <div className={limit ? "" : "max-h-[400px] overflow-y-auto"}>
        {displayedNotifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={() => handleNotificationClick(notification)}
            onMarkAsRead={showActions ? handleMarkAsRead : undefined}
            onDelete={showActions ? handleDelete : undefined}
            showActions={showActions}
            isDeleting={deletingIds.has(notification.id)}
          />
        ))}
      </div>
    </div>
  );
}
