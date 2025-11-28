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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface RefundDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (amount?: number, reason?: string) => Promise<void>
  productName?: string
  userName?: string
  maxAmount?: number
  isLoading?: boolean
}

export function RefundDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  userName,
  maxAmount,
  isLoading = false,
}: RefundDialogProps) {
  const [amount, setAmount] = useState<string>('')
  const [reason, setReason] = useState('')

  const handleConfirm = async () => {
    const refundAmount = amount ? parseInt(amount, 10) : undefined
    await onConfirm(refundAmount, reason || undefined)
    setAmount('')
    setReason('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAmount('')
      setReason('')
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rembourser la réservation</AlertDialogTitle>
          <AlertDialogDescription>
            {productName && userName ? (
              <>
                Vous allez rembourser la réservation de <strong>{productName}</strong> pour{' '}
                <strong>{userName}</strong>.
              </>
            ) : (
              'Vous allez rembourser cette réservation.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="refund-amount">
              Montant à rembourser (crédits)
              {maxAmount && (
                <span className="text-muted-foreground ml-1">
                  (max: {maxAmount})
                </span>
              )}
            </Label>
            <Input
              id="refund-amount"
              type="number"
              min="0"
              max={maxAmount}
              placeholder={maxAmount ? `Maximum ${maxAmount} crédits` : 'Montant en crédits'}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour rembourser le montant total
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">Raison du remboursement (optionnel)</Label>
            <Textarea
              id="refund-reason"
              placeholder="Indiquez la raison du remboursement..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
            />
          </div>
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
              'Confirmer le remboursement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
