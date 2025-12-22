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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";

interface PenaltyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (amount: number, reason: string) => Promise<void>;
  productName?: string;
  userName?: string;
  userCurrentBalance?: number;
  isLoading?: boolean;
}

export function PenaltyDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  userName,
  userCurrentBalance,
  isLoading = false,
}: PenaltyDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [reason, setReason] = useState("");

  const amountNum = amount ? parseInt(amount, 10) : 0;
  const willBeNegative =
    userCurrentBalance !== undefined && amountNum > userCurrentBalance;
  const newBalance =
    userCurrentBalance !== undefined ? userCurrentBalance - amountNum : null;

  const isValid = amountNum > 0 && reason.trim().length > 0;

  const handleConfirm = async () => {
    if (!isValid) return;
    await onConfirm(amountNum, reason);
    setAmount("");
    setReason("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAmount("");
      setReason("");
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Appliquer une pénalité</AlertDialogTitle>
          <AlertDialogDescription>
            {productName && userName ? (
              <>
                Vous allez appliquer une pénalité pour la réservation de{" "}
                <strong>{productName}</strong> de <strong>{userName}</strong>.
              </>
            ) : (
              "Vous allez appliquer une pénalité à cette réservation."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="penalty-amount">Montant de la pénalité *</Label>
            <Input
              id="penalty-amount"
              type="number"
              min="1"
              placeholder="Montant en crédits"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
            {userCurrentBalance !== undefined && (
              <p className="text-xs text-muted-foreground">
                Solde actuel de l'utilisateur : {userCurrentBalance} crédits
              </p>
            )}
          </div>

          {willBeNegative && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cette pénalité passera le solde de l'utilisateur en négatif (
                {newBalance} crédits).
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="penalty-reason">Motif de la pénalité *</Label>
            <Textarea
              id="penalty-reason"
              placeholder="Indiquez le motif de la pénalité..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !isValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Appliquer la pénalité"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
