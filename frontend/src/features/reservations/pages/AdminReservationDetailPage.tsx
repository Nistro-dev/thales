import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useAdminReservation,
  useCheckoutReservation,
  useReturnReservation,
  useCancelReservation,
  useRefundReservation,
} from "../hooks/useReservations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  FileText,
  AlertCircle,
  UserCircle,
  CheckCircle,
  RotateCcw,
  X,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { ReservationDetailSkeleton } from "../components/ReservationDetailSkeleton";
import { CheckoutDialog } from "../components/CheckoutDialog";
import { ReturnDialog } from "../components/ReturnDialog";
import { AdminCancelDialog } from "../components/AdminCancelDialog";
import { RefundDialog } from "../components/RefundDialog";
import type { ReservationStatus, ProductCondition } from "@/types";

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

type DialogType = "checkout" | "return" | "cancel" | "refund" | null;

export function AdminReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: reservation, isLoading, isError } = useAdminReservation(id!);
  const checkoutMutation = useCheckoutReservation();
  const returnMutation = useReturnReservation();
  const cancelMutation = useCancelReservation();
  const refundMutation = useRefundReservation();
  const [dialogType, setDialogType] = useState<DialogType>(null);

  const handleCheckout = async (notes?: string) => {
    try {
      await checkoutMutation.mutateAsync({ id: id!, notes });
      setDialogType(null);
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleReturn = async (condition: ProductCondition, notes?: string) => {
    try {
      await returnMutation.mutateAsync({
        id: id!,
        data: { condition, notes },
      });
      setDialogType(null);
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleCancel = async (reason?: string) => {
    try {
      await cancelMutation.mutateAsync({ id: id!, reason });
      setDialogType(null);
    } catch {
      // Error handled by mutation onError
    }
  };

  const handleRefund = async (amount?: number, reason?: string) => {
    try {
      await refundMutation.mutateAsync({ id: id!, amount, reason });
      setDialogType(null);
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    cancelMutation.isPending ||
    refundMutation.isPending;

  if (isLoading) {
    return <ReservationDetailSkeleton />;
  }

  if (isError || !reservation) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-destructive bg-destructive/10 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="text-lg font-semibold text-destructive">
                Réservation introuvable
              </p>
              <p className="text-sm text-muted-foreground">
                Cette réservation n'existe pas ou vous n'y avez pas accès
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin/reservations">Retour aux réservations</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const canCheckout = reservation.status === "CONFIRMED";
  const canReturn = reservation.status === "CHECKED_OUT";
  const canCancel = reservation.status === "CONFIRMED";
  // Can refund if CANCELLED or RETURNED, but not already refunded
  const canRefund =
    (reservation.status === "CANCELLED" || reservation.status === "RETURNED") &&
    !reservation.refundedAt;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost">
        <Link to="/admin/reservations">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux réservations
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Détail de la réservation
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground break-all">
            #{reservation.id}
          </p>
        </div>
        <Badge
          variant={statusColors[reservation.status]}
          className="text-sm sm:text-base self-start"
        >
          {statusLabels[reservation.status]}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* User Info */}
          {reservation.user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium">Nom</p>
                  <p className="text-muted-foreground">
                    {reservation.user.firstName} {reservation.user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground">
                    {reservation.user.email}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {reservation.product?.name || "Produit"}
                </h3>
                {reservation.product?.reference && (
                  <p className="text-sm text-muted-foreground">
                    Référence: {reservation.product.reference}
                  </p>
                )}
              </div>

              {reservation.product?.description && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    {reservation.product.description}
                  </p>
                </>
              )}

              <Separator />
              <Button asChild variant="outline" className="w-full">
                <Link to={`/products/${reservation.productId}`}>
                  Voir le produit
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Dates & Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dates et durée
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Date de sortie</p>
                  <p className="text-muted-foreground">
                    {formatDate(reservation.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date de retour</p>
                  <p className="text-muted-foreground">
                    {formatDate(reservation.endDate)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-sm font-medium">Durée totale</span>
                <span className="text-muted-foreground">
                  {calculateDuration(
                    reservation.startDate,
                    reservation.endDate,
                  )}{" "}
                  jours
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cost */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Coût
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">Total</span>
                <div className="text-right">
                  <span className="text-2xl font-bold">
                    {reservation.creditsCharged}
                  </span>
                  <span className="text-muted-foreground ml-1">crédits</span>
                </div>
              </div>

              {reservation.refundAmount !== null &&
                reservation.refundAmount > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-baseline justify-between text-green-600">
                      <span className="text-sm font-medium">
                        Montant remboursé
                      </span>
                      <div className="text-right">
                        <span className="text-xl font-bold">
                          {reservation.refundAmount}
                        </span>
                        <span className="ml-1">crédits</span>
                      </div>
                    </div>
                  </>
                )}

              {reservation.status === "CANCELLED" &&
                !reservation.refundedAt && (
                  <>
                    <Separator className="my-4" />
                    <div className="flex items-baseline justify-between text-orange-600">
                      <span className="text-sm font-medium">Non remboursé</span>
                      <div className="text-right text-sm text-muted-foreground">
                        Annulation hors délai
                      </div>
                    </div>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(reservation.notes ||
            reservation.adminNotes ||
            reservation.cancelReason) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reservation.notes && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      Notes utilisateur
                    </p>
                    <p className="text-sm text-muted-foreground italic">
                      {reservation.notes}
                    </p>
                  </div>
                )}

                {reservation.adminNotes && (
                  <>
                    {reservation.notes && <Separator />}
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Notes administrateur
                      </p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {reservation.adminNotes}
                      </p>
                    </div>
                  </>
                )}

                {reservation.cancelReason && (
                  <>
                    {(reservation.notes || reservation.adminNotes) && (
                      <Separator />
                    )}
                    <div className="rounded-lg bg-destructive/10 p-3">
                      <p className="text-sm font-medium text-destructive mb-1">
                        Motif d'annulation
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {reservation.cancelReason}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions & Timeline */}
        <div className="space-y-6">
          {/* Actions */}
          {(canCheckout || canReturn || canCancel || canRefund) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {canCheckout && (
                  <Button
                    className="w-full"
                    onClick={() => setDialogType("checkout")}
                    disabled={isActionPending}
                  >
                    {checkoutMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Effectuer le retrait
                  </Button>
                )}

                {canReturn && (
                  <Button
                    className="w-full"
                    onClick={() => setDialogType("return")}
                    disabled={isActionPending}
                  >
                    {returnMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    )}
                    Effectuer le retour
                  </Button>
                )}

                {canRefund && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDialogType("refund")}
                    disabled={isActionPending}
                  >
                    {refundMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="mr-2 h-4 w-4" />
                    )}
                    Rembourser
                  </Button>
                )}

                {canCancel && (
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDialogType("cancel")}
                    disabled={isActionPending}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Annuler la réservation
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">Créée</p>
                  <p className="text-muted-foreground">
                    {formatDateTime(reservation.createdAt)}
                  </p>
                </div>

                {reservation.checkedOutAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium">Retirée</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(reservation.checkedOutAt)}
                      </p>
                    </div>
                  </>
                )}

                {reservation.returnedAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium">Retournée</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(reservation.returnedAt)}
                      </p>
                    </div>
                  </>
                )}

                {reservation.cancelledAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-destructive">Annulée</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(reservation.cancelledAt)}
                      </p>
                    </div>
                  </>
                )}

                {reservation.refundedAt && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium text-green-600">Remboursée</p>
                      <p className="text-muted-foreground">
                        {formatDateTime(reservation.refundedAt)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <CheckoutDialog
        open={dialogType === "checkout"}
        onOpenChange={(open) => !open && setDialogType(null)}
        onConfirm={handleCheckout}
        productName={reservation.product?.name}
        userName={
          reservation.user
            ? `${reservation.user.firstName} ${reservation.user.lastName}`
            : undefined
        }
        isLoading={checkoutMutation.isPending}
      />

      <ReturnDialog
        open={dialogType === "return"}
        onOpenChange={(open) => !open && setDialogType(null)}
        onConfirm={handleReturn}
        productName={reservation.product?.name}
        userName={
          reservation.user
            ? `${reservation.user.firstName} ${reservation.user.lastName}`
            : undefined
        }
        isLoading={returnMutation.isPending}
      />

      <AdminCancelDialog
        open={dialogType === "cancel"}
        onOpenChange={(open) => !open && setDialogType(null)}
        onConfirm={handleCancel}
        productName={reservation.product?.name}
        userName={
          reservation.user
            ? `${reservation.user.firstName} ${reservation.user.lastName}`
            : undefined
        }
        isLoading={cancelMutation.isPending}
      />

      <RefundDialog
        open={dialogType === "refund"}
        onOpenChange={(open) => !open && setDialogType(null)}
        onConfirm={handleRefund}
        productName={reservation.product?.name}
        userName={
          reservation.user
            ? `${reservation.user.firstName} ${reservation.user.lastName}`
            : undefined
        }
        maxAmount={reservation.creditsCharged}
        isLoading={refundMutation.isPending}
      />
    </div>
  );
}
