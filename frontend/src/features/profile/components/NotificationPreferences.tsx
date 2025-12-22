import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Bell, Mail, Smartphone } from "lucide-react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
} from "../hooks/useNotificationPreferences";
import type { NotificationPreferenceItem, NotificationType } from "@/types";

// Group notification types by category for better UX
// Note: PASSWORD_CHANGED and SYSTEM are not configurable (security notifications always sent)
const NOTIFICATION_CATEGORIES = {
  reservations: {
    label: "Réservations",
    types: [
      "RESERVATION_CONFIRMED",
      "RESERVATION_CANCELLED",
      "RESERVATION_REFUNDED",
      "RESERVATION_CHECKOUT",
      "RESERVATION_RETURN",
      "RESERVATION_REMINDER",
      "RESERVATION_EXTENDED",
      "RESERVATION_OVERDUE",
      "RESERVATION_EXPIRED",
    ] as NotificationType[],
  },
  credits: {
    label: "Crédits",
    types: ["CREDIT_ADDED", "CREDIT_REMOVED"] as NotificationType[],
  },
};

interface NotificationRowProps {
  preference: NotificationPreferenceItem;
  onToggle: (
    type: NotificationType,
    channel: "email" | "inApp",
    value: boolean,
  ) => void;
  isUpdating: boolean;
}

function NotificationRow({
  preference,
  onToggle,
  isUpdating,
}: NotificationRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b last:border-b-0">
      <div className="flex-1">
        <p className="font-medium text-sm">{preference.label}</p>
        <p className="text-xs text-muted-foreground">
          {preference.description}
        </p>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={preference.emailEnabled}
            onCheckedChange={(checked) =>
              onToggle(preference.notificationType, "email", checked)
            }
            disabled={isUpdating}
            aria-label={`Email pour ${preference.label}`}
          />
        </div>
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={preference.inAppEnabled}
            onCheckedChange={(checked) =>
              onToggle(preference.notificationType, "inApp", checked)
            }
            disabled={isUpdating}
            aria-label={`In-app pour ${preference.label}`}
          />
        </div>
      </div>
    </div>
  );
}

export function NotificationPreferences() {
  const {
    data: preferences,
    isLoading,
    isError,
  } = useNotificationPreferences();
  const updatePreference = useUpdateNotificationPreference();

  const handleToggle = (
    type: NotificationType,
    channel: "email" | "inApp",
    value: boolean,
  ) => {
    const currentPref = preferences?.find((p) => p.notificationType === type);
    if (!currentPref) return;

    updatePreference.mutate({
      type,
      data: {
        emailEnabled: channel === "email" ? value : currentPref.emailEnabled,
        inAppEnabled: channel === "inApp" ? value : currentPref.inAppEnabled,
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-destructive">
            Erreur lors du chargement des préférences
          </p>
        </CardContent>
      </Card>
    );
  }

  // Create a map for quick lookup
  const preferencesMap = new Map(
    preferences.map((p) => [p.notificationType, p]),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Préférences de notifications
        </CardTitle>
        <CardDescription>
          Choisissez comment vous souhaitez être notifié pour chaque type
          d'événement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Legend */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground border-b pb-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            <span>In-app</span>
          </div>
        </div>

        {/* Categories */}
        {Object.entries(NOTIFICATION_CATEGORIES).map(([key, category]) => {
          const categoryPreferences = category.types
            .map((type) => preferencesMap.get(type))
            .filter((p): p is NotificationPreferenceItem => p !== undefined);

          if (categoryPreferences.length === 0) return null;

          return (
            <div key={key} className="space-y-2">
              <Label className="text-base font-semibold">
                {category.label}
              </Label>
              <div className="bg-muted/30 rounded-lg px-4">
                {categoryPreferences.map((pref) => (
                  <NotificationRow
                    key={pref.notificationType}
                    preference={pref}
                    onToggle={handleToggle}
                    isUpdating={updatePreference.isPending}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
