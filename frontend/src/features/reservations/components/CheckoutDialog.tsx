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

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (notes?: string) => Promise<void>
  productName?: string
  userName?: string
  isLoading?: boolean
}

export function CheckoutDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  userName,
  isLoading = false,
}: CheckoutDialogProps) {
  const [notes, setNotes] = useState('')

  const handleConfirm = async () => {
    await onConfirm(notes || undefined)
    setNotes('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setNotes('')
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer le retrait</AlertDialogTitle>
          <AlertDialogDescription>
            {productName && userName ? (
              <>
                Vous allez effectuer le retrait de <strong>{productName}</strong> pour{' '}
                <strong>{userName}</strong>.
              </>
            ) : (
              'Vous allez effectuer le retrait du matériel.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="checkout-notes">Notes (optionnel)</Label>
          <Textarea
            id="checkout-notes"
            placeholder="Ajoutez des notes pour ce retrait..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              'Confirmer le retrait'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
