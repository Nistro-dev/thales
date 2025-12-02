import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  CheckCircle,
  XCircle,
  RefreshCcw,
  LogOut,
  LogIn,
  Clock,
  AlertTriangle,
  Coins,
  Shield,
  Lock,
  Bell,
  X,
  Check,
  Loader2,
} from "lucide-react";
import type { Notification, NotificationType } from "@/api/notifications.api";

const typeIcons: Record<NotificationType, React.ElementType> = {
  RESERVATION_CONFIRMED: CheckCircle,
  RESERVATION_CANCELLED: XCircle,
  RESERVATION_REFUNDED: RefreshCcw,
  RESERVATION_CHECKOUT: LogOut,
  RESERVATION_RETURN: LogIn,
  RESERVATION_REMINDER: Clock,
  RESERVATION_EXTENDED: Calendar,
  RESERVATION_OVERDUE: AlertTriangle,
  RESERVATION_EXPIRED: AlertTriangle,
  CREDIT_ADDED: Coins,
  CREDIT_REMOVED: Coins,
  ACCOUNT_ACTIVATED: Shield,
  PASSWORD_CHANGED: Lock,
};

const typeColors: Record<NotificationType, string> = {
  RESERVATION_CONFIRMED: "text-green-500",
  RESERVATION_CANCELLED: "text-red-500",
  RESERVATION_REFUNDED: "text-blue-500",
  RESERVATION_CHECKOUT: "text-orange-500",
  RESERVATION_RETURN: "text-green-500",
  RESERVATION_REMINDER: "text-yellow-500",
  RESERVATION_EXTENDED: "text-blue-500",
  RESERVATION_OVERDUE: "text-red-500",
  RESERVATION_EXPIRED: "text-gray-500",
  CREDIT_ADDED: "text-green-500",
  CREDIT_REMOVED: "text-red-500",
  ACCOUNT_ACTIVATED: "text-green-500",
  PASSWORD_CHANGED: "text-blue-500",
};

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  isDeleting?: boolean;
}

export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  showActions = false,
  isDeleting = false,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Bell;
  const iconColor = typeColors[notification.type] || "text-muted-foreground";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMarkAsRead?.(notification.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  return (
    <div
      className={cn(
        "flex gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors rounded-md group",
        !notification.read && "bg-accent/30",
      )}
      onClick={onClick}
    >
      <div className={cn("mt-0.5", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium",
            !notification.read && "font-semibold",
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatDate(notification.createdAt)}
        </p>
      </div>
      {showActions && (
        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.read && onMarkAsRead && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleMarkAsRead}
              title="Marquer comme lu"
            >
              <Check className="h-4 w-4 text-green-500" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Supprimer"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )}
            </Button>
          )}
        </div>
      )}
      {!showActions && !notification.read && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
