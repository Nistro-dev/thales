import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ReservationDatePicker } from './ReservationDatePicker'
import { useCreateReservation } from '../hooks/useReservations'
import type { Product } from '@/types'
import { Loader2 } from 'lucide-react'

interface ReservationModalProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReservationModal({ product, open, onOpenChange }: ReservationModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [isValid, setIsValid] = useState(false)

  const createReservation = useCreateReservation()

  const duration =
    startDate && endDate
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0

  const totalCost = duration && product.priceCredits ? duration * product.priceCredits : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!startDate || !endDate) {
      return
    }

    const formatDateLocal = (date: Date): string => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const startDateStr = formatDateLocal(startDate)
    const endDateStr = formatDateLocal(endDate)

    try {
      await createReservation.mutateAsync({
        productId: product.id,
        startDate: startDateStr,
        endDate: endDateStr,
        notes: notes.trim() || undefined,
      })

      setStartDate(undefined)
      setEndDate(undefined)
      setNotes('')
      onOpenChange(false)
    } catch {}
  }

  const handleClose = () => {
    if (!createReservation.isPending) {
      setStartDate(undefined)
      setEndDate(undefined)
      setNotes('')
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Réserver ce produit</DialogTitle>
          <DialogDescription>
            Complétez les informations ci-dessous pour créer votre réservation
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.reference}</p>
              </div>
              {product.priceCredits !== null && (
                <Badge variant="secondary" className="text-base">
                  {product.priceCredits} crédits/jour
                </Badge>
              )}
            </div>
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Section:</span>{' '}
                <span className="font-medium">{product.section.name}</span>
              </div>
              {product.subSection && (
                <div>
                  <span className="text-muted-foreground">Sous-section:</span>{' '}
                  <span className="font-medium">{product.subSection.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date Picker */}
          <ReservationDatePicker
            product={product}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onValidationChange={setIsValid}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Informations complémentaires sur votre réservation..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/500 caractères
            </p>
          </div>

          {/* Form Actions */}
          <div className="space-y-3 pt-4 border-t">
            {!isValid && startDate && endDate && (
              <p className="text-sm text-destructive text-center">
                Veuillez corriger les erreurs ci-dessus pour continuer
              </p>
            )}
            {!startDate && !endDate && (
              <p className="text-sm text-muted-foreground text-center">
                Veuillez sélectionner les dates pour continuer
              </p>
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createReservation.isPending}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isValid || createReservation.isPending}
                className="flex-1"
              >
                {createReservation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  `Réserver (${totalCost} crédits)`
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
