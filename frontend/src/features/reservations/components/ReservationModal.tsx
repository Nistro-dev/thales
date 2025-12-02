import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
      ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      : 0

  // Calculate total cost based on credit period (per day or per week)
  const calculateTotalCost = () => {
    if (!duration || !product.priceCredits) return 0
    if (product.creditPeriod === 'WEEK') {
      const weeks = Math.ceil(duration / 7)
      return weeks * product.priceCredits
    }
    return duration * product.priceCredits
  }
  const totalCost = calculateTotalCost()

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
    } catch {
      // Error handled by mutation onError
    }
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
        className="w-[calc(100vw-1rem)] max-w-[360px] max-h-[calc(100vh-1rem)] overflow-hidden flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="text-base">Réserver</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 space-y-3">
            {/* Product Info - Compact */}
            <div className="rounded-lg border p-2.5 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.reference}</p>
                </div>
                {product.priceCredits !== null && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {product.priceCredits} cr/{product.creditPeriod === 'WEEK' ? 'sem' : 'j'}
                  </Badge>
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

            {/* Notes - Collapsible */}
            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs">Notes (optionnel)</Label>
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

          {/* Form Actions - Fixed at bottom */}
          <div className="shrink-0 p-4 border-t bg-background space-y-2">
            {!isValid && startDate && endDate && (
              <p className="text-xs text-destructive text-center">
                Corrigez les erreurs ci-dessus
              </p>
            )}
            {!startDate && !endDate && (
              <p className="text-xs text-muted-foreground text-center">
                Sélectionnez les dates
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createReservation.isPending}
                className="flex-1"
                size="sm"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isValid || createReservation.isPending}
                className="flex-1"
                size="sm"
              >
                {createReservation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Création...
                  </>
                ) : (
                  `Réserver (${totalCost} cr)`
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
