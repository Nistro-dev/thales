import { useState } from "react";
import { scanApi } from "@/api/reservations.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  QrCode,
  Scan,
  CheckCircle,
  RotateCcw,
  Loader2,
  AlertCircle,
  UserCircle,
  Package,
  Calendar,
  Camera,
  Keyboard,
} from "lucide-react";
import { CheckoutDialog } from "../components/CheckoutDialog";
import { ReturnDialog } from "../components/ReturnDialog";
import { QRScanner } from "@/components/QRScanner";
import type { Reservation, ReservationStatus, ProductCondition } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

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

type DialogType = "checkout" | "return" | null;

export function QRScannerPage() {
  const [qrCode, setQrCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedReservation, setScannedReservation] =
    useState<Reservation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [scannerActive, setScannerActive] = useState(true);

  const queryClient = useQueryClient();

  const handleCameraScan = async (scannedCode: string) => {
    setScannerActive(false);
    setIsScanning(true);
    setError(null);
    setScannedReservation(null);

    try {
      const response = await scanApi.scan(scannedCode.trim());
      setScannedReservation(response.data.data?.reservation || null);
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      setError(
        error.response?.data?.message || "Erreur lors du scan du QR code",
      );
      setScannedReservation(null);
      setScannerActive(true);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualScan = async () => {
    if (!qrCode.trim()) {
      setError("Veuillez entrer un code QR");
      return;
    }

    setIsScanning(true);
    setError(null);
    setScannedReservation(null);

    try {
      const response = await scanApi.scan(qrCode.trim());
      setScannedReservation(response.data.data?.reservation || null);
      setQrCode("");
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      setError(
        error.response?.data?.message || "Erreur lors du scan du QR code",
      );
      setScannedReservation(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCheckout = async (notes?: string) => {
    if (!scannedReservation) return;

    setIsProcessing(true);
    try {
      await scanApi.checkout(scannedReservation.qrCode!, notes);
      toast.success("Produit retiré avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      setScannedReservation(null);
      setQrCode("");
      setDialogType(null);
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      toast.error(error.response?.data?.message || "Erreur lors du retrait");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async (
    condition: ProductCondition,
    notes?: string,
    photos?: Array<{ file: File; caption?: string }>,
  ) => {
    if (!scannedReservation) return;

    setIsProcessing(true);
    try {
      await scanApi.return(scannedReservation.qrCode!, {
        condition,
        notes,
        photos,
      });
      toast.success("Produit retourné avec succès");
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      setScannedReservation(null);
      setQrCode("");
      setDialogType(null);
    } catch (err: unknown) {
      const error = err as Error & {
        response?: { data?: { message?: string } };
      };
      toast.error(error.response?.data?.message || "Erreur lors du retour");
    } finally {
      setIsProcessing(false);
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

  const canCheckout = scannedReservation?.status === "CONFIRMED";
  const canReturn = scannedReservation?.status === "CHECKED_OUT";
  const canPerformAction = canCheckout || canReturn;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Scanner QR</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Scannez un QR code de réservation pour effectuer un retrait ou un
          retour
        </p>
      </div>

      {/* Scanner */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <QrCode className="h-4 w-4 sm:h-5 sm:w-5" />
            Scanner le QR code
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Caméra</span>
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <Keyboard className="h-4 w-4" />
                <span className="hidden sm:inline">Manuel</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="mt-4">
              {isScanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Recherche de la réservation...
                  </p>
                </div>
              ) : (
                <QRScanner
                  onScan={handleCameraScan}
                  isActive={scannerActive && !scannedReservation}
                />
              )}
            </TabsContent>

            <TabsContent value="manual" className="mt-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="qrCode">Code QR</Label>
                  <Input
                    id="qrCode"
                    type="text"
                    placeholder="Entrez le code QR..."
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleManualScan();
                      }
                    }}
                    disabled={isScanning || isProcessing}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleManualScan}
                    disabled={isScanning || isProcessing || !qrCode.trim()}
                    className="w-full sm:w-auto"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scan...
                      </>
                    ) : (
                      <>
                        <Scan className="mr-2 h-4 w-4" />
                        Valider
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Scanned Reservation Details */}
      {scannedReservation && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Produit
                  </CardTitle>
                  <Badge variant={statusColors[scannedReservation.status]}>
                    {statusLabels[scannedReservation.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <h3 className="font-semibold text-lg">
                  {scannedReservation.product?.name || "Produit"}
                </h3>
                {scannedReservation.product?.reference && (
                  <p className="text-sm text-muted-foreground">
                    Référence: {scannedReservation.product.reference}
                  </p>
                )}
                {scannedReservation.product?.description && (
                  <>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      {scannedReservation.product.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {scannedReservation.user && (
                  <>
                    <div>
                      <p className="text-sm font-medium">Nom</p>
                      <p className="text-muted-foreground">
                        {scannedReservation.user.firstName}{" "}
                        {scannedReservation.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-muted-foreground">
                        {scannedReservation.user.email}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dates & Duration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Date de sortie</p>
                    <p className="text-muted-foreground">
                      {formatDate(scannedReservation.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date de retour</p>
                    <p className="text-muted-foreground">
                      {formatDate(scannedReservation.endDate)}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Durée</span>
                  <span className="text-muted-foreground">
                    {calculateDuration(
                      scannedReservation.startDate,
                      scannedReservation.endDate,
                    )}{" "}
                    jours
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm font-medium">Coût total</span>
                  <span className="font-bold">
                    {scannedReservation.creditsCharged} crédits
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {(scannedReservation.notes || scannedReservation.adminNotes) && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {scannedReservation.notes && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        Notes utilisateur
                      </p>
                      <p className="text-sm text-muted-foreground italic">
                        {scannedReservation.notes}
                      </p>
                    </div>
                  )}
                  {scannedReservation.adminNotes && (
                    <>
                      {scannedReservation.notes && <Separator />}
                      <div>
                        <p className="text-sm font-medium mb-1">
                          Notes administrateur
                        </p>
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {scannedReservation.adminNotes}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <Card className={canPerformAction ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {canCheckout && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setDialogType("checkout")}
                    disabled={isProcessing}
                  >
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Effectuer le retrait
                  </Button>
                )}

                {canReturn && (
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => setDialogType("return")}
                    disabled={isProcessing}
                  >
                    <RotateCcw className="mr-2 h-5 w-5" />
                    Effectuer le retour
                  </Button>
                )}

                {!canPerformAction && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {scannedReservation.status === "RETURNED" &&
                        "Cette réservation est déjà terminée."}
                      {scannedReservation.status === "CANCELLED" &&
                        "Cette réservation a été annulée."}
                      {scannedReservation.status === "REFUNDED" &&
                        "Cette réservation a été remboursée."}
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setScannedReservation(null);
                    setQrCode("");
                    setScannerActive(true);
                  }}
                  disabled={isProcessing}
                >
                  Nouveau scan
                </Button>
              </CardContent>
            </Card>

            {/* Reservation ID */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Référence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  {scannedReservation.id}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CheckoutDialog
        open={dialogType === "checkout"}
        onOpenChange={(open) => !open && setDialogType(null)}
        onConfirm={handleCheckout}
        productName={scannedReservation?.product?.name}
        userName={
          scannedReservation?.user
            ? `${scannedReservation.user.firstName} ${scannedReservation.user.lastName}`
            : undefined
        }
        isLoading={isProcessing}
      />

      <ReturnDialog
        open={dialogType === "return"}
        onOpenChange={(open) => !open && setDialogType(null)}
        onConfirm={handleReturn}
        productName={scannedReservation?.product?.name}
        userName={
          scannedReservation?.user
            ? `${scannedReservation.user.firstName} ${scannedReservation.user.lastName}`
            : undefined
        }
        isLoading={isProcessing}
      />
    </div>
  );
}
