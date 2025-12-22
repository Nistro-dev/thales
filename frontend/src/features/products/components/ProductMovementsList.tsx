import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  CheckCircle,
  Settings,
  Wrench,
  Package,
  Archive,
  Ban,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductMovement } from "@/api/products.api";
import type { ProductCondition } from "@/types";

interface ProductMovementsListProps {
  movements: ProductMovement[];
  isLoading?: boolean;
}

const conditionConfig: Record<
  ProductCondition,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  OK: { label: "OK", variant: "default" },
  MINOR_DAMAGE: { label: "Dégâts mineurs", variant: "secondary" },
  MAJOR_DAMAGE: { label: "Dégâts majeurs", variant: "destructive" },
  MISSING_PARTS: { label: "Pièces manquantes", variant: "destructive" },
  BROKEN: { label: "Cassé", variant: "destructive" },
};

const statusLabels: Record<string, string> = {
  AVAILABLE: "Disponible",
  UNAVAILABLE: "Indisponible",
  MAINTENANCE: "Maintenance",
  ARCHIVED: "Archivé",
};

const statusIcons: Record<string, React.ElementType> = {
  AVAILABLE: Package,
  UNAVAILABLE: Ban,
  MAINTENANCE: Wrench,
  ARCHIVED: Archive,
};

const statusColors: Record<string, string> = {
  AVAILABLE:
    "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400",
  UNAVAILABLE: "text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400",
  MAINTENANCE:
    "text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-400",
  ARCHIVED: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400",
};

// Parse status change notes to extract old and new status
function parseStatusChange(
  notes: string | null | undefined,
): { from: string; to: string } | null {
  if (!notes) return null;
  // Format: "Changement de statut: OLD → NEW"
  const match = notes.match(/Changement de statut:\s*(\w+)\s*→\s*(\w+)/);
  if (match) {
    return { from: match[1], to: match[2] };
  }
  return null;
}

export function ProductMovementsList({
  movements,
  isLoading,
}: ProductMovementsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun mouvement enregistré
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((movement) => {
        const isCheckout = movement.type === "CHECKOUT";
        const isReturn = movement.type === "RETURN";
        const isStatusChange = movement.type === "STATUS_CHANGE";
        const reservationUser = movement.reservation?.user;
        const performedByUser = movement.performedByUser;
        const condition = movement.condition;
        const hasIssue = condition && condition !== "OK" && isReturn;
        const statusChange = isStatusChange
          ? parseStatusChange(movement.notes)
          : null;
        const NewStatusIcon = statusChange
          ? statusIcons[statusChange.to] || Settings
          : Settings;

        return (
          <div
            key={movement.id}
            className={cn(
              "flex items-start gap-4 p-4 rounded-lg border",
              hasIssue &&
                "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30",
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                "flex-shrink-0 p-2 rounded-full",
                isCheckout &&
                  "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
                isReturn &&
                  "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
                isStatusChange &&
                  (statusChange
                    ? statusColors[statusChange.to]
                    : "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"),
              )}
            >
              {isCheckout && <ArrowUpFromLine className="h-4 w-4" />}
              {isReturn && <ArrowDownToLine className="h-4 w-4" />}
              {isStatusChange && <NewStatusIcon className="h-4 w-4" />}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {isCheckout && <span className="font-medium">Sortie</span>}
                {isReturn && (
                  <>
                    <span className="font-medium">Retour</span>
                    {condition && (
                      <Badge variant={conditionConfig[condition].variant}>
                        {conditionConfig[condition].label}
                      </Badge>
                    )}
                  </>
                )}
                {isStatusChange && statusChange && (
                  <>
                    <span className="font-medium">Changement de statut</span>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Badge variant="outline" className="font-normal">
                        {statusLabels[statusChange.from] || statusChange.from}
                      </Badge>
                      <span className="text-muted-foreground">→</span>
                      <Badge
                        variant={
                          statusChange.to === "AVAILABLE"
                            ? "default"
                            : statusChange.to === "MAINTENANCE"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {statusLabels[statusChange.to] || statusChange.to}
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                <div className="flex items-center flex-wrap gap-x-2">
                  {/* Utilisateur de la réservation (pour checkout/return) */}
                  {(isCheckout || isReturn) && reservationUser && (
                    <>
                      <span>
                        {reservationUser.firstName} {reservationUser.lastName}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span>
                    {format(
                      new Date(movement.performedAt),
                      "dd MMM yyyy à HH:mm",
                      { locale: fr },
                    )}
                  </span>
                </div>
                {/* Utilisateur qui a effectué l'action */}
                {performedByUser && (
                  <div className="flex items-center gap-1 text-xs">
                    <User className="h-3 w-3" />
                    <span>
                      Par {performedByUser.firstName} {performedByUser.lastName}
                    </span>
                  </div>
                )}
              </div>

              {/* Show notes only for checkout/return, not for status changes (already displayed above) */}
              {movement.notes && !isStatusChange && (
                <p className="mt-2 text-sm bg-muted/50 p-2 rounded">
                  {movement.notes}
                </p>
              )}

              {/* Photos for returns with damage */}
              {movement.photos && movement.photos.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {movement.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={photo.url}
                        alt="Photo du retour"
                        className="h-16 w-16 object-cover rounded border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0">
              {hasIssue ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
