import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, AlertTriangle, Wrench, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  usePreviewMaintenance,
  useCreateMaintenance,
} from "../hooks/useMaintenance";
import type { MaintenancePreview } from "@/api/maintenance.api";

interface MaintenanceDialogProps {
  productId: string;
  productName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaintenanceDialog({
  productId,
  productName,
  open,
  onOpenChange,
}: MaintenanceDialogProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<MaintenancePreview | null>(null);
  const [step, setStep] = useState<"form" | "preview">("form");

  const previewMutation = usePreviewMaintenance();
  const createMutation = useCreateMaintenance();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStartDate(new Date());
      setEndDate(undefined);
      setReason("");
      setPreview(null);
      setStep("form");
    }
  }, [open]);

  const handlePreview = async () => {
    if (!startDate) return;

    try {
      const response = await previewMutation.mutateAsync({
        productId,
        data: {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
          reason: reason.trim() || null,
        },
      });

      setPreview(response.data.data ?? null);
      setStep("preview");
    } catch {
      // Error handled in hook
    }
  };

  const handleCreate = async () => {
    if (!startDate) return;

    try {
      await createMutation.mutateAsync({
        productId,
        data: {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: endDate ? format(endDate, "yyyy-MM-dd") : null,
          reason: reason.trim() || null,
        },
      });

      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  const handleBack = () => {
    setStep("form");
    setPreview(null);
  };

  const isIndefinite = !endDate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            Mettre en maintenance
          </DialogTitle>
          <DialogDescription>
            Planifier une maintenance pour <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <>
            <div className="space-y-4 py-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate
                        ? format(startDate, "d MMMM yyyy", { locale: fr })
                        : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      locale={fr}
                      disabled={(date: Date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label>
                  Date de fin{" "}
                  <span className="text-muted-foreground">(optionnelle)</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate
                        ? format(endDate, "d MMMM yyyy", { locale: fr })
                        : "Durée indéterminée"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="p-2 border-b">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEndDate(undefined)}
                        className="w-full justify-start"
                      >
                        Durée indéterminée
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      locale={fr}
                      disabled={(date: Date) =>
                        date < (startDate || new Date()) ||
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  La date de fin est inclusive. Vide = durée indéterminée
                  (bloque toutes les réservations futures).
                </p>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label>
                  Raison{" "}
                  <span className="text-muted-foreground">(optionnelle)</span>
                </Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Révision annuelle, pièce cassée..."
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Info box for indefinite maintenance */}
              {isIndefinite && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Maintenance à durée indéterminée</AlertTitle>
                  <AlertDescription>
                    Toutes les réservations futures seront annulées et
                    remboursées. Le produit sera inaccessible jusqu'à ce que
                    vous terminiez manuellement la maintenance.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handlePreview}
                disabled={!startDate || previewMutation.isPending}
              >
                {previewMutation.isPending ? "Chargement..." : "Suivant"}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "preview" && preview && (
          <>
            <div className="space-y-4 py-4">
              {/* Overlap warning */}
              {preview.hasOverlap && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Chevauchement détecté</AlertTitle>
                  <AlertDescription>
                    Une maintenance existe déjà pour cette période. Veuillez
                    choisir d'autres dates.
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary */}
              {!preview.hasOverlap && (
                <>
                  <div className="rounded-lg border p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Début :</span>
                      <span className="font-medium">
                        {startDate &&
                          format(startDate, "d MMMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fin :</span>
                      <span className="font-medium">
                        {endDate
                          ? format(endDate, "d MMMM yyyy", { locale: fr })
                          : "Indéterminée"}
                      </span>
                    </div>
                    {reason && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Raison :</span>
                        <span className="font-medium">{reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Affected reservations warning */}
                  {preview.totalReservationsAffected > 0 ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>
                        {preview.totalReservationsAffected} réservation(s)
                        seront annulées
                      </AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p>
                          Un total de{" "}
                          <strong>
                            {preview.totalCreditsToRefund} crédits
                          </strong>{" "}
                          seront remboursés automatiquement.
                        </p>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {preview.affectedReservations.map((res) => (
                            <div
                              key={res.id}
                              className="text-sm py-1 border-t first:border-t-0"
                            >
                              <span className="font-medium">
                                {res.user.firstName} {res.user.lastName}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                - {format(
                                  new Date(res.startDate),
                                  "dd/MM",
                                )} au {format(new Date(res.endDate), "dd/MM")} (
                                {res.creditsCharged} crédits)
                              </span>
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>Aucune réservation impactée</AlertTitle>
                      <AlertDescription>
                        Il n'y a pas de réservation prévue pendant cette période
                        de maintenance.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleBack}>
                Retour
              </Button>
              {!preview.hasOverlap && (
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {createMutation.isPending
                    ? "Création..."
                    : "Confirmer la maintenance"}
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
