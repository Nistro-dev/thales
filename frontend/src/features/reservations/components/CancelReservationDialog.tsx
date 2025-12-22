import { useState } from "react";
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
import { Loader2, AlertTriangle } from "lucide-react";

interface CancelReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  productName?: string;
  isLoading?: boolean;
  /** Start date of the reservation (ISO string) */
  startDate?: string;
  /** Refund deadline in hours from section config */
  refundDeadlineHours?: number;
  /** Credits that would be refunded */
  creditsCharged?: number;
}

export function CancelReservationDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  isLoading = false,
  startDate,
  refundDeadlineHours = 48,
  creditsCharged,
}: CancelReservationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate if refund is eligible
  const isEligibleForRefund = (() => {
    if (!startDate) return true; // Fallback to yes if no date provided
    const now = new Date();
    const start = new Date(startDate);
    const hoursUntilStart =
      (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilStart >= refundDeadlineHours;
  })();

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isLoading || isSubmitting;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>
                Êtes-vous sûr de vouloir annuler cette réservation
                {productName ? ` pour "${productName}"` : ""} ?
              </p>
              <div className="mt-4">
                {isEligibleForRefund ? (
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {creditsCharged
                      ? `Vous serez remboursé de ${creditsCharged} crédit${creditsCharged > 1 ? "s" : ""}.`
                      : "Les crédits seront remboursés sur votre compte."}
                  </p>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-800 dark:text-orange-200">
                      <p className="font-semibold">Annulation hors délai</p>
                      <p>
                        Le délai de {refundDeadlineHours}h avant le début de la
                        réservation est dépassé.
                        <strong>
                          {" "}
                          Vous ne serez pas remboursé automatiquement.
                        </strong>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Contactez un administrateur pour une demande de
                        remboursement exceptionnelle.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Cette action est irréversible.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Non, garder</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Annulation...
              </>
            ) : (
              "Oui, annuler"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
