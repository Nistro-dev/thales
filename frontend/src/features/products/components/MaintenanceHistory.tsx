import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Wrench,
  Calendar,
  CreditCard,
  User,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMaintenanceHistory } from "../hooks/useMaintenance";
import type { ProductMaintenance } from "@/api/maintenance.api";

interface MaintenanceHistoryProps {
  productId: string;
}

function getMaintenanceStatus(
  maintenance: ProductMaintenance,
): "active" | "scheduled" | "ended" {
  const now = new Date();
  const startDate = new Date(maintenance.startDate);
  const endDate = maintenance.endDate ? new Date(maintenance.endDate) : null;

  if (maintenance.endedAt) {
    return "ended";
  }

  if (startDate > now) {
    return "scheduled";
  }

  if (!endDate || endDate >= now) {
    return "active";
  }

  return "ended";
}

function MaintenanceStatusBadge({
  maintenance,
}: {
  maintenance: ProductMaintenance;
}) {
  const status = getMaintenanceStatus(maintenance);

  if (status === "active") {
    return (
      <Badge className="bg-orange-500 hover:bg-orange-600">
        <Wrench className="h-3 w-3 mr-1" />
        En cours
      </Badge>
    );
  }

  if (status === "scheduled") {
    return (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        <Clock className="h-3 w-3 mr-1" />
        Programmée
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <CheckCircle className="h-3 w-3 mr-1" />
      Terminée
    </Badge>
  );
}

export function MaintenanceHistory({ productId }: MaintenanceHistoryProps) {
  const { data: maintenances, isLoading } = useMaintenanceHistory(productId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (!maintenances || maintenances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wrench className="h-12 w-12 mx-auto mb-3 opacity-20" />
        <p>Aucun historique de maintenance</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Statut</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Raison</TableHead>
              <TableHead className="text-center">
                <Tooltip>
                  <TooltipTrigger>
                    <XCircle className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>Réservations annulées</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead className="text-center">
                <Tooltip>
                  <TooltipTrigger>
                    <CreditCard className="h-4 w-4" />
                  </TooltipTrigger>
                  <TooltipContent>Crédits remboursés</TooltipContent>
                </Tooltip>
              </TableHead>
              <TableHead>Créée par</TableHead>
              <TableHead>Terminée</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenances.map((maintenance) => (
              <TableRow key={maintenance.id}>
                <TableCell>
                  <MaintenanceStatusBadge maintenance={maintenance} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(maintenance.startDate), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                    {" - "}
                    {maintenance.endDate
                      ? format(new Date(maintenance.endDate), "dd/MM/yyyy", {
                          locale: fr,
                        })
                      : "Indéterminée"}
                  </div>
                </TableCell>
                <TableCell>
                  {maintenance.reason ? (
                    <Tooltip>
                      <TooltipTrigger className="text-left">
                        <span className="text-sm max-w-[150px] truncate block">
                          {maintenance.reason}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {maintenance.reason}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {maintenance.cancelledReservationsCount > 0 ? (
                    <span className="font-medium text-red-600">
                      {maintenance.cancelledReservationsCount}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {maintenance.refundedCreditsTotal > 0 ? (
                    <span className="font-medium">
                      {maintenance.refundedCreditsTotal}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[80px]">
                      {maintenance.createdBy.substring(0, 8)}...
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {maintenance.endedAt ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(maintenance.endedAt), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {maintenance.endedBy === "SYSTEM"
                          ? "Terminée automatiquement"
                          : `Terminée par ${maintenance.endedBy}`}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TooltipProvider>
  );
}
