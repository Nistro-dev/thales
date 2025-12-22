import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CheckCircle,
  XCircle,
  Wrench,
  Archive,
  MoreVertical,
  Calendar,
  StopCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { MaintenanceDialog } from "./MaintenanceDialog";
import {
  useMaintenanceStatus,
  useEndMaintenance,
  useCancelMaintenance,
} from "../hooks/useMaintenance";
import { useUpdateProductStatus } from "../hooks/useProductsAdmin";
import type { ProductStatus } from "@/types";

interface ProductStatusManagerProps {
  productId: string;
  productName: string;
  currentStatus: ProductStatus;
  disabled?: boolean;
}

export function ProductStatusManager({
  productId,
  productName,
  currentStatus,
  disabled = false,
}: ProductStatusManagerProps) {
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [endMaintenanceDialogOpen, setEndMaintenanceDialogOpen] =
    useState(false);
  const [cancelMaintenanceDialogOpen, setCancelMaintenanceDialogOpen] =
    useState(false);
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<
    string | null
  >(null);

  const { data: maintenanceStatus } = useMaintenanceStatus(productId);
  const updateStatus = useUpdateProductStatus();
  const endMaintenance = useEndMaintenance();
  const cancelMaintenance = useCancelMaintenance();

  const handleStatusChange = async (status: ProductStatus) => {
    await updateStatus.mutateAsync({ id: productId, status });
  };

  const handleEndMaintenance = async () => {
    if (!selectedMaintenanceId) return;
    await endMaintenance.mutateAsync({
      productId,
      maintenanceId: selectedMaintenanceId,
    });
    setEndMaintenanceDialogOpen(false);
    setSelectedMaintenanceId(null);
  };

  const handleCancelMaintenance = async () => {
    if (!selectedMaintenanceId) return;
    await cancelMaintenance.mutateAsync({
      productId,
      maintenanceId: selectedMaintenanceId,
    });
    setCancelMaintenanceDialogOpen(false);
    setSelectedMaintenanceId(null);
  };

  const activeMaintenance = maintenanceStatus?.active;
  const scheduledMaintenances = maintenanceStatus?.scheduled || [];
  const hasActiveMaintenance = !!activeMaintenance;
  const hasScheduledMaintenances = scheduledMaintenances.length > 0;

  return (
    <>
      <div className="space-y-3">
        {/* Current Status */}
        <div className="flex items-center gap-2">
          <ProductStatusBadge status={currentStatus} />
          {!disabled && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Only show status changes if not in maintenance */}
                {currentStatus !== "MAINTENANCE" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("AVAILABLE")}
                      disabled={
                        currentStatus === "AVAILABLE" || updateStatus.isPending
                      }
                    >
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Disponible
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("UNAVAILABLE")}
                      disabled={
                        currentStatus === "UNAVAILABLE" ||
                        updateStatus.isPending
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2 text-red-600" />
                      Indisponible
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Maintenance option */}
                {!hasActiveMaintenance && (
                  <DropdownMenuItem
                    onClick={() => setMaintenanceDialogOpen(true)}
                  >
                    <Wrench className="h-4 w-4 mr-2 text-orange-500" />
                    Mettre en maintenance
                  </DropdownMenuItem>
                )}

                {/* End active maintenance */}
                {hasActiveMaintenance && (
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedMaintenanceId(activeMaintenance.id);
                      setEndMaintenanceDialogOpen(true);
                    }}
                  >
                    <StopCircle className="h-4 w-4 mr-2 text-green-600" />
                    Terminer la maintenance
                  </DropdownMenuItem>
                )}

                {currentStatus !== "MAINTENANCE" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleStatusChange("ARCHIVED")}
                      disabled={
                        currentStatus === "ARCHIVED" || updateStatus.isPending
                      }
                    >
                      <Archive className="h-4 w-4 mr-2 text-gray-600" />
                      Archiver
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Active Maintenance Info */}
        {hasActiveMaintenance && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-orange-700 dark:text-orange-400">
              <Wrench className="h-4 w-4" />
              Maintenance en cours
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-500 space-y-1">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Depuis le{" "}
                {format(new Date(activeMaintenance.startDate), "d MMMM yyyy", {
                  locale: fr,
                })}
              </div>
              {activeMaintenance.endDate ? (
                <div>
                  Jusqu'au{" "}
                  {format(new Date(activeMaintenance.endDate), "d MMMM yyyy", {
                    locale: fr,
                  })}{" "}
                  (inclus)
                </div>
              ) : (
                <div className="font-medium">Durée indéterminée</div>
              )}
              {activeMaintenance.reason && (
                <div className="mt-1 italic">
                  Raison : {activeMaintenance.reason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scheduled Maintenances */}
        {hasScheduledMaintenances && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Maintenances programmées :
            </div>
            {scheduledMaintenances.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border p-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-blue-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(new Date(m.startDate), "dd/MM/yyyy")}
                    {m.endDate
                      ? ` - ${format(new Date(m.endDate), "dd/MM/yyyy")}`
                      : " - Indéterminée"}
                  </Badge>
                  {m.reason && (
                    <span className="text-muted-foreground truncate max-w-[100px]">
                      {m.reason}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-red-500 hover:text-red-700"
                  onClick={() => {
                    setSelectedMaintenanceId(m.id);
                    setCancelMaintenanceDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Dialog */}
      <MaintenanceDialog
        productId={productId}
        productName={productName}
        open={maintenanceDialogOpen}
        onOpenChange={setMaintenanceDialogOpen}
      />

      {/* End Maintenance Confirmation */}
      <AlertDialog
        open={endMaintenanceDialogOpen}
        onOpenChange={setEndMaintenanceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <StopCircle className="h-5 w-5 text-green-600" />
              Terminer la maintenance
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le produit <strong>{productName}</strong> sera remis en statut
              "Disponible" et pourra de nouveau être réservé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={endMaintenance.isPending}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndMaintenance}
              disabled={endMaintenance.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {endMaintenance.isPending ? "Traitement..." : "Terminer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Scheduled Maintenance Confirmation */}
      <AlertDialog
        open={cancelMaintenanceDialogOpen}
        onOpenChange={setCancelMaintenanceDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Annuler la maintenance programmée
            </AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler cette maintenance programmée ?
              <br />
              <br />
              <strong>Note :</strong> Les réservations déjà annulées et
              remboursées lors de la création de cette maintenance ne seront pas
              restaurées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMaintenance.isPending}>
              Retour
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMaintenance}
              disabled={cancelMaintenance.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {cancelMaintenance.isPending ? "Annulation..." : "Annuler"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
