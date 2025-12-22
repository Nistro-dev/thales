import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ReservationDatePicker } from "./ReservationDatePicker";
import { useCreateReservation } from "../hooks/useReservations";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Product } from "@/types";
import { Loader2, AlertCircle, Calendar, Clock } from "lucide-react";

interface ReservationModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReservationModal({
  product,
  open,
  onOpenChange,
}: ReservationModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [isValid, setIsValid] = useState(false);

  const createReservation = useCreateReservation();
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const duration =
    startDate && endDate
      ? Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1
      : 0;

  const calculateTotalCost = () => {
    if (!duration || !product.priceCredits) return 0;
    if (product.creditPeriod === "WEEK") {
      const weeks = Math.ceil(duration / 7);
      return weeks * product.priceCredits;
    }
    return duration * product.priceCredits;
  };
  const totalCost = calculateTotalCost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      return;
    }

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const startDateStr = formatDateLocal(startDate);
    const endDateStr = formatDateLocal(endDate);

    try {
      await createReservation.mutateAsync({
        productId: product.id,
        startDate: startDateStr,
        endDate: endDateStr,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        notes: notes.trim() || undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch {
      // Error handled by mutation onError
    }
  };

  const resetForm = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime(undefined);
    setEndTime(undefined);
    setNotes("");
  };

  const handleClose = () => {
    if (!createReservation.isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  // Determine what message to show in footer
  const getFooterMessage = () => {
    if (!startDate && !endDate) {
      return {
        type: "info" as const,
        icon: Calendar,
        message: "Sélectionnez les dates de réservation",
      };
    }
    if (!isValid && startDate && endDate) {
      return {
        type: "error" as const,
        icon: AlertCircle,
        message: "Vérifiez les créneaux horaires ci-dessus",
      };
    }
    if (startDate && !endDate) {
      return {
        type: "info" as const,
        icon: Calendar,
        message: "Sélectionnez la date de retour",
      };
    }
    return null;
  };

  const footerMessage = getFooterMessage();

  const formContent = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {/* Product Info */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight">
                {product.name}
              </h3>
              {product.reference && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {product.reference}
                </p>
              )}
            </div>
            {product.priceCredits !== null && (
              <Badge variant="secondary" className="text-xs shrink-0">
                {product.priceCredits} cr/
                {product.creditPeriod === "WEEK" ? "sem" : "j"}
              </Badge>
            )}
          </div>
        </div>

        {/* Date Picker */}
        <ReservationDatePicker
          product={product}
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onValidationChange={setIsValid}
        />

        {/* Notes */}
        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-xs font-medium">
            Notes (optionnel)
          </Label>
          <Textarea
            id="notes"
            placeholder="Informations complémentaires..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            className="text-sm resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t bg-background space-y-3">
        {/* Status message */}
        {footerMessage && (
          <div
            className={`flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-md ${
              footerMessage.type === "error"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <footerMessage.icon className="h-3.5 w-3.5 shrink-0" />
            <span>{footerMessage.message}</span>
          </div>
        )}

        {/* Summary when valid */}
        {isValid && startDate && endDate && (
          <div className="flex items-center justify-between py-2 px-3 bg-primary/5 rounded-md border border-primary/10">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                {duration} jour{duration > 1 ? "s" : ""}
              </span>
            </div>
            <span className="font-semibold text-sm">{totalCost} crédits</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createReservation.isPending}
            className="flex-1"
            size="default"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={!isValid || createReservation.isPending}
            className="flex-1"
            size="default"
          >
            {createReservation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </div>
      </div>
    </form>
  );

  // Mobile: Use Drawer
  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-base">Réserver</DrawerTitle>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">Réserver</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
