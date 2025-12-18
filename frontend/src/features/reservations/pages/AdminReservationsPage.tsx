import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useAdminReservations,
  useCheckoutReservation,
  useReturnReservation,
  useCancelReservation,
} from "../hooks/useReservations";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  AlertCircle,
  Loader2,
  Eye,
  CheckCircle,
  RotateCcw,
  X,
  UserCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Clock,
  QrCode,
} from "lucide-react";
import { ReservationCardSkeleton } from "../components/ReservationCardSkeleton";
import { ReservationFiltersSkeleton } from "../components/ReservationFiltersSkeleton";
import { CheckoutDialog } from "../components/CheckoutDialog";
import { ReturnDialog } from "../components/ReturnDialog";
import { AdminCancelDialog } from "../components/AdminCancelDialog";
import { QRScannerDialog } from "../components/QRScannerDialog";
import type {
  ReservationStatus,
  ReservationFilters,
  Reservation,
  ProductCondition,
} from "@/types";

const statusLabels: Record<ReservationStatus, string> = {
  CONFIRMED: "Confirmée",
  CHECKED_OUT: "En cours",
  RETURNED: "Terminée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

const statusColors: Record<
  ReservationStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CONFIRMED: "default",
  CHECKED_OUT: "default",
  RETURNED: "outline",
  CANCELLED: "destructive",
  REFUNDED: "outline",
};

interface DialogState {
  type: "checkout" | "return" | "cancel" | null;
  reservation: Reservation | null;
}

export function AdminReservationsPage() {
  const [activeTab, setActiveTab] = useState<
    "all" | "checkouts" | "returns" | "overdue"
  >("all");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"startDate" | "createdAt" | "endDate">(
    "startDate",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>({
    type: null,
    reservation: null,
  });
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const [overdueType, setOverdueType] = useState<"checkouts" | "returns">(
    "checkouts",
  );

  const getFilters = (): ReservationFilters => {
    const baseFilters: ReservationFilters = {
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      sortBy,
      sortOrder,
    };

    if (activeTab === "checkouts") {
      return {
        ...baseFilters,
        status: "CONFIRMED",
        startDateFrom: today,
        startDateTo: today,
      };
    }

    if (activeTab === "returns") {
      return {
        ...baseFilters,
        status: "CHECKED_OUT",
        startDateFrom: today,
        startDateTo: today,
      };
    }

    if (activeTab === "overdue") {
      return {
        sortBy,
        sortOrder,
        overdue: overdueType,
      };
    }

    return baseFilters;
  };

  const { data, isLoading, isError } = useAdminReservations(
    getFilters(),
    page,
    limit,
  );
  const checkoutMutation = useCheckoutReservation();
  const returnMutation = useReturnReservation();
  const cancelMutation = useCancelReservation();

  const openDialog = (
    type: "checkout" | "return" | "cancel",
    reservation: Reservation,
  ) => {
    setDialogState({ type, reservation });
  };

  const closeDialog = () => {
    setDialogState({ type: null, reservation: null });
  };

  const handleCheckout = async (notes?: string) => {
    if (!dialogState.reservation) return;
    try {
      await checkoutMutation.mutateAsync({
        id: dialogState.reservation.id,
        notes,
      });
      closeDialog();
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleReturn = async (condition: ProductCondition, notes?: string) => {
    if (!dialogState.reservation) return;
    try {
      await returnMutation.mutateAsync({
        id: dialogState.reservation.id,
        data: { condition, notes },
      });
      closeDialog();
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleCancel = async (reason?: string) => {
    if (!dialogState.reservation) return;
    try {
      await cancelMutation.mutateAsync({
        id: dialogState.reservation.id,
        reason,
      });
      closeDialog();
    } catch {
      // Error handled by mutation onError
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const isActionPending =
    checkoutMutation.isPending ||
    returnMutation.isPending ||
    cancelMutation.isPending;

  const resetFilters = () => {
    setStatusFilter("all");
    setSearchQuery("");
    setSortBy("startDate");
    setSortOrder("desc");
    setPage(1);
  };

  const hasActiveFilters =
    statusFilter !== "all" ||
    searchQuery !== "" ||
    sortBy !== "startDate" ||
    sortOrder !== "desc";

  const totalPages = data?.pagination?.totalPages || 1;
  const currentPage = data?.pagination?.page || page;
  const totalItems = data?.pagination?.total || 0;

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  const filteredReservations: Reservation[] =
    data?.data.filter((reservation: Reservation) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      const productName = reservation.product?.name?.toLowerCase() || "";
      const productRef = reservation.product?.reference?.toLowerCase() || "";
      const userName =
        `${reservation.user?.firstName || ""} ${reservation.user?.lastName || ""}`.toLowerCase();
      const userEmail = reservation.user?.email?.toLowerCase() || "";
      return (
        productName.includes(query) ||
        productRef.includes(query) ||
        userName.includes(query) ||
        userEmail.includes(query)
      );
    }) || [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Gestion des réservations
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gérez les réservations et les mouvements de matériel
          </p>
        </div>
        <Button
          onClick={() => setQrScannerOpen(true)}
          className="w-full sm:w-auto"
        >
          <QrCode className="mr-2 h-4 w-4" />
          Scanner QR
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as typeof activeTab);
          setPage(1);
          setStatusFilter("all");
        }}
      >
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger
            value="all"
            className="flex-1 min-w-fit px-3 text-xs sm:text-sm"
          >
            Toutes
          </TabsTrigger>
          <TabsTrigger
            value="checkouts"
            className="flex-1 min-w-fit px-3 text-xs sm:text-sm"
          >
            Sorties du jour
          </TabsTrigger>
          <TabsTrigger
            value="returns"
            className="flex-1 min-w-fit px-3 text-sm sm:text-sm"
          >
            Retours du jour
          </TabsTrigger>
          <TabsTrigger
            value="overdue"
            className="flex-1 min-w-fit px-3 text-xs sm:text-sm text-destructive data-[state=active]:text-destructive"
          >
            <Clock className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
            En retard
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Overdue Type Filter */}
          {activeTab === "overdue" && (
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <Label>Type de retard :</Label>
                <Select
                  value={overdueType}
                  onValueChange={(value) => {
                    setOverdueType(value as "checkouts" | "returns");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checkouts">Sorties en retard</SelectItem>
                    <SelectItem value="returns">Retours en retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>
          )}

          {/* Filters */}
          {activeTab === "all" &&
            (isLoading ? (
              <ReservationFiltersSkeleton />
            ) : (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Rechercher par produit, utilisateur, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="sm:w-48">
                      <Select
                        value={statusFilter}
                        onValueChange={(value) => {
                          setStatusFilter(value as ReservationStatus | "all");
                          setPage(1);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                          <SelectItem value="CHECKED_OUT">En cours</SelectItem>
                          <SelectItem value="RETURNED">Terminée</SelectItem>
                          <SelectItem value="CANCELLED">Annulée</SelectItem>
                          <SelectItem value="REFUNDED">Remboursée</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="sm:w-auto"
                    >
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Plus de filtres
                    </Button>

                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        onClick={resetFilters}
                        className="sm:w-auto"
                      >
                        Réinitialiser
                      </Button>
                    )}
                  </div>

                  {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Trier par</Label>
                        <Select
                          value={sortBy}
                          onValueChange={(value) => {
                            setSortBy(value as typeof sortBy);
                            setPage(1);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="startDate">
                              Date de sortie
                            </SelectItem>
                            <SelectItem value="endDate">
                              Date de retour
                            </SelectItem>
                            <SelectItem value="createdAt">
                              Date de création
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Ordre</Label>
                        <Select
                          value={sortOrder}
                          onValueChange={(value) => {
                            setSortOrder(value as typeof sortOrder);
                            setPage(1);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="desc">
                              Plus récent d'abord
                            </SelectItem>
                            <SelectItem value="asc">
                              Plus ancien d'abord
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Résultats par page</Label>
                        <Select
                          value={limit.toString()}
                          onValueChange={(value) => {
                            setLimit(Number(value));
                            setPage(1);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <ReservationCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <Card className="border-destructive bg-destructive/10 p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <div>
                  <p className="text-lg font-semibold text-destructive">
                    Erreur de chargement
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Impossible de charger les réservations
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Reservations List */}
          {!isLoading && !isError && data && (
            <>
              {data.pagination && activeTab === "all" && (
                <div className="text-sm text-muted-foreground">
                  {totalItems} réservation{totalItems > 1 ? "s" : ""} trouvée
                  {totalItems > 1 ? "s" : ""}
                  {searchQuery && ` pour "${searchQuery}"`}
                </div>
              )}

              {filteredReservations.length === 0 ? (
                <Card className="p-12">
                  <div className="flex flex-col items-center gap-4 text-center">
                    {activeTab === "overdue" ? (
                      <CheckCircle className="h-16 w-16 text-green-500" />
                    ) : (
                      <Calendar className="h-16 w-16 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-lg font-semibold">
                        {activeTab === "overdue"
                          ? "Aucun retard"
                          : "Aucune réservation"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {activeTab === "checkouts" &&
                          "Aucune sortie prévue aujourd'hui"}
                        {activeTab === "returns" &&
                          "Aucun retour prévu aujourd'hui"}
                        {activeTab === "overdue" &&
                          overdueType === "checkouts" &&
                          "Aucune sortie en retard"}
                        {activeTab === "overdue" &&
                          overdueType === "returns" &&
                          "Aucun retour en retard"}
                        {activeTab === "all" && hasActiveFilters
                          ? "Aucune réservation ne correspond à vos filtres"
                          : activeTab === "all" && "Aucune réservation trouvée"}
                      </p>
                    </div>
                    {hasActiveFilters && activeTab === "all" && (
                      <Button variant="outline" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredReservations.map((reservation) => (
                    <Card key={reservation.id} className="p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {reservation.product?.name || "Produit"}
                              </h3>
                              {reservation.product?.reference && (
                                <p className="text-sm text-muted-foreground">
                                  Réf: {reservation.product.reference}
                                </p>
                              )}
                            </div>
                            <Badge variant={statusColors[reservation.status]}>
                              {statusLabels[reservation.status]}
                            </Badge>
                          </div>

                          {/* User Info */}
                          {reservation.user && (
                            <div className="flex items-center gap-2 text-sm">
                              <UserCircle className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {reservation.user.firstName}{" "}
                                {reservation.user.lastName}
                              </span>
                              <span className="text-muted-foreground">
                                ({reservation.user.email})
                              </span>
                            </div>
                          )}

                          {/* Dates */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">
                                Date de sortie
                              </p>
                              <p className="font-medium">
                                {formatDate(reservation.startDate)}
                              </p>
                              {reservation.startTime && (
                                <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {reservation.startTime}
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Date de retour
                              </p>
                              <p className="font-medium">
                                {formatDate(reservation.endDate)}
                              </p>
                              {reservation.endTime && (
                                <p className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                                  <Clock className="h-3 w-3" />
                                  {reservation.endTime}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Duration & Cost */}
                          <div className="flex gap-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Durée:{" "}
                              </span>
                              <span className="font-medium">
                                {calculateDuration(
                                  reservation.startDate,
                                  reservation.endDate,
                                )}{" "}
                                jours
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Coût:{" "}
                              </span>
                              <span className="font-medium">
                                {reservation.creditsCharged} crédits
                              </span>
                            </div>
                          </div>

                          {/* Notes */}
                          {(reservation.notes || reservation.adminNotes) && (
                            <div className="text-sm space-y-1">
                              {reservation.notes && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Notes utilisateur:
                                  </p>
                                  <p className="italic">{reservation.notes}</p>
                                </div>
                              )}
                              {reservation.adminNotes && (
                                <div>
                                  <p className="text-muted-foreground">
                                    Notes admin:
                                  </p>
                                  <p className="font-medium whitespace-pre-line">
                                    {reservation.adminNotes}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {reservation.status === "CANCELLED" &&
                            reservation.cancelReason && (
                              <div className="text-sm">
                                <p className="text-muted-foreground">
                                  Motif d'annulation:
                                </p>
                                <p>{reservation.cancelReason}</p>
                              </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[160px]">
                          <Button
                            asChild
                            variant="outline"
                            className="flex-1 lg:flex-none"
                          >
                            <Link to={`/admin/reservations/${reservation.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Détails
                            </Link>
                          </Button>

                          {reservation.status === "CONFIRMED" && (
                            <Button
                              variant="default"
                              className="flex-1 lg:flex-none"
                              onClick={() =>
                                openDialog("checkout", reservation)
                              }
                              disabled={isActionPending}
                            >
                              {checkoutMutation.isPending &&
                              dialogState.reservation?.id === reservation.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="mr-2 h-4 w-4" />
                              )}
                              Retirer
                            </Button>
                          )}

                          {reservation.status === "CHECKED_OUT" && (
                            <Button
                              variant="default"
                              className="flex-1 lg:flex-none"
                              onClick={() => openDialog("return", reservation)}
                              disabled={isActionPending}
                            >
                              {returnMutation.isPending &&
                              dialogState.reservation?.id === reservation.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                              )}
                              Retourner
                            </Button>
                          )}

                          {reservation.status === "CONFIRMED" && (
                            <Button
                              variant="destructive"
                              className="flex-1 lg:flex-none"
                              onClick={() => openDialog("cancel", reservation)}
                              disabled={isActionPending}
                            >
                              {cancelMutation.isPending &&
                              dialogState.reservation?.id === reservation.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <X className="mr-2 h-4 w-4" />
                              )}
                              Annuler
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data.pagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} sur {totalPages} ({totalItems} résultat
                    {totalItems > 1 ? "s" : ""})
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-1 mx-2">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? "default"
                                    : "outline"
                                }
                                size="icon"
                                onClick={() => goToPage(pageNum)}
                                className="w-9 h-9"
                              >
                                {pageNum}
                              </Button>
                            );
                          },
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CheckoutDialog
        open={dialogState.type === "checkout"}
        onOpenChange={(open) => !open && closeDialog()}
        onConfirm={handleCheckout}
        productName={dialogState.reservation?.product?.name}
        userName={
          dialogState.reservation?.user
            ? `${dialogState.reservation.user.firstName} ${dialogState.reservation.user.lastName}`
            : undefined
        }
        isLoading={checkoutMutation.isPending}
      />

      <ReturnDialog
        open={dialogState.type === "return"}
        onOpenChange={(open) => !open && closeDialog()}
        onConfirm={handleReturn}
        productName={dialogState.reservation?.product?.name}
        userName={
          dialogState.reservation?.user
            ? `${dialogState.reservation.user.firstName} ${dialogState.reservation.user.lastName}`
            : undefined
        }
        isLoading={returnMutation.isPending}
      />

      <AdminCancelDialog
        open={dialogState.type === "cancel"}
        onOpenChange={(open) => !open && closeDialog()}
        onConfirm={handleCancel}
        productName={dialogState.reservation?.product?.name}
        userName={
          dialogState.reservation?.user
            ? `${dialogState.reservation.user.firstName} ${dialogState.reservation.user.lastName}`
            : undefined
        }
        isLoading={cancelMutation.isPending}
      />

      <QRScannerDialog open={qrScannerOpen} onOpenChange={setQrScannerOpen} />
    </div>
  );
}
