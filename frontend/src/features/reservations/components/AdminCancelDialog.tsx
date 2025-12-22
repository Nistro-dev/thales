import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface AdminCancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason?: string) => Promise<void>
  productName?: string
  userName?: string
  isLoading?: boolean
}

export function AdminCancelDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  userName,
  isLoading = false,
}: AdminCancelDialogProps) {
  const [reason, setReason] = useState('')

  const handleConfirm = async () => {
    await onConfirm(reason || undefined)
    setReason('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setReason('')
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la réservation</AlertDialogTitle>
          <AlertDialogDescription>
            {productName && userName ? (
              <>
                Vous allez annuler la réservation de <strong>{productName}</strong> pour{' '}
                <strong>{userName}</strong>. Cette action est irréversible.
              </>
            ) : (
              "Vous allez annuler cette réservation. Cette action est irréversible."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Motif d'annulation (optionnel)</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Indiquez le motif de l'annulation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              'Confirmer l\'annulation'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
