import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useMyReservation,
  useMyReservationQR,
  useCancelMyReservation,
} from "../hooks/useReservations";
import { useQRCode } from "@/hooks/useQRCode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Calendar,
  Package,
  CreditCard,
  FileText,
  AlertCircle,
  X,
  Download,
  Loader2,
  Clock,
} from "lucide-react";
import { ReservationDetailSkeleton } from "../components/ReservationDetailSkeleton";
import { CancelReservationDialog } from "../components/CancelReservationDialog";
import type { ReservationStatus } from "@/types";

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

export function ReservationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: reservation, isLoading, isError } = useMyReservation(id!);
  const { data: qrData } = useMyReservationQR(
    id!,
    reservation?.status === "CONFIRMED",
  );
  const { qrCodeUrl, isLoading: isQRLoading } = useQRCode(qrData?.qrCode, {
    width: 256,
  });
  const cancelReservation = useCancelMyReservation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const handleConfirmCancel = async () => {
    await cancelReservation.mutateAsync({ id: id! });
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

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `reservation-${id}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
              <Link to="/my-reservations">Retour aux réservations</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const canCancel = reservation.status === "CONFIRMED";
  const showQRCode = reservation.status === "CONFIRMED" && qrData?.qrCode;
  const hasQRImage = showQRCode && qrCodeUrl;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost">
        <Link to="/my-reservations">
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
                  {reservation.startTime && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-primary font-medium">
                        {reservation.startTime}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Date de retour</p>
                  <p className="text-muted-foreground">
                    {formatDate(reservation.endDate)}
                  </p>
                  {reservation.endTime && (
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-primary font-medium">
                        {reservation.endTime}
                      </span>
                    </div>
                  )}
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

              {reservation.status === "REFUNDED" &&
                reservation.refundAmount !== null && (
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
                    <p className="text-sm font-medium mb-1">Vos notes</p>
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

        {/* Right Column - QR Code & Actions */}
        <div className="space-y-6">
          {/* QR Code */}
          {showQRCode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">QR Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  type="button"
                  onClick={() => hasQRImage && setQrModalOpen(true)}
                  className="flex justify-center bg-white p-4 rounded-lg min-h-[232px] items-center w-full cursor-pointer hover:bg-gray-50 transition-colors"
                  disabled={!hasQRImage}
                >
                  {isQRLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : hasQRImage ? (
                    <img
                      src={qrCodeUrl}
                      alt="QR Code de réservation"
                      className="w-full max-w-[200px] h-auto"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      QR code non disponible
                    </p>
                  )}
                </button>
                <p className="text-xs text-center text-muted-foreground">
                  Présentez ce QR code lors du retrait du matériel
                  {hasQRImage && (
                    <span className="block mt-1">Cliquez pour agrandir</span>
                  )}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={downloadQRCode}
                  disabled={!hasQRImage}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
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

          {/* Actions */}
          {canCancel && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setCancelDialogOpen(true)}
            >
              <X className="mr-2 h-4 w-4" />
              Annuler la réservation
            </Button>
          )}
        </div>
      </div>

      {/* Cancel Reservation Dialog */}
      <CancelReservationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        productName={reservation.product?.name}
        isLoading={cancelReservation.isPending}
        startDate={reservation.startDate}
        refundDeadlineHours={reservation.product?.section?.refundDeadlineHours}
        creditsCharged={reservation.creditsCharged}
      />

      {/* QR Code Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center gap-4 py-4">
            <h2 className="text-lg font-semibold">QR Code de réservation</h2>
            {qrCodeUrl && (
              <div className="bg-white p-6 rounded-lg">
                <img
                  src={qrCodeUrl}
                  alt="QR Code de réservation"
                  className="w-[280px] h-[280px]"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Présentez ce QR code lors du retrait du matériel
            </p>
            <Button onClick={downloadQRCode} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Télécharger
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
