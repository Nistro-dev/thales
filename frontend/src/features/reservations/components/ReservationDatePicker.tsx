import { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'
import type { Product } from '@/types'

interface ReservationDatePickerProps {
  product: Product
  startDate: Date | undefined
  endDate: Date | undefined
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  reservedDates?: string[]
  onValidationChange?: (isValid: boolean) => void
}

export function ReservationDatePicker({
  product,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  reservedDates = [],
  onValidationChange,
}: ReservationDatePickerProps) {
  // Helper: Check if a date is in the allowed days array
  const isAllowedDay = (date: Date, allowedDays: number[] | undefined): boolean => {
    if (!allowedDays || allowedDays.length === 0) return true
    const dayOfWeek = date.getDay()
    // Convert backend format (1=Monday, 7=Sunday) to JS format (0=Sunday, 1=Monday)
    return allowedDays.some((day) => {
      const jsDay = day === 7 ? 0 : day
      return dayOfWeek === jsDay
    })
  }

  // Helper: Check if date is reserved
  const isDateReserved = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0]
    return reservedDates.includes(dateStr)
  }

  // Get allowed days names for display
  const getAllowedDaysNames = (days: number[] | undefined): string => {
    if (!days || days.length === 0) return 'Tous les jours'
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return days
      .map((day) => {
        const jsDay = day === 7 ? 0 : day
        return dayNames[jsDay]
      })
      .join(', ')
  }

  // Format date for input
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  // Parse date from input
  const parseDateFromInput = (value: string): Date | undefined => {
    if (!value) return undefined
    const date = new Date(value)
    return isNaN(date.getTime()) ? undefined : date
  }

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Validate start date
    if (startDate) {
      if (startDate < today) {
        errors.push('La date de sortie ne peut pas être dans le passé')
      }
      if (!isAllowedDay(startDate, product.section.allowedDaysOut)) {
        errors.push(
          `La date de sortie doit être un : ${getAllowedDaysNames(product.section.allowedDaysOut)}`
        )
      }
      if (isDateReserved(startDate)) {
        errors.push('La date de sortie est déjà réservée')
      }
    }

    // Validate end date
    if (endDate) {
      if (!startDate) {
        errors.push('Veuillez sélectionner une date de sortie d\'abord')
      } else {
        if (endDate <= startDate) {
          errors.push('La date de retour doit être après la date de sortie')
        }
        if (!isAllowedDay(endDate, product.section.allowedDaysIn)) {
          errors.push(
            `La date de retour doit être un : ${getAllowedDaysNames(product.section.allowedDaysIn)}`
          )
        }

        // Check duration
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        if (durationDays < product.minDuration) {
          errors.push(`La durée minimale est de ${product.minDuration} jours`)
        }
        if (durationDays > product.maxDuration) {
          errors.push(`La durée maximale est de ${product.maxDuration} jours`)
        }

        // Check if any date in range is reserved
        const currentDate = new Date(startDate)
        while (currentDate <= endDate) {
          if (isDateReserved(currentDate)) {
            errors.push('Une ou plusieurs dates dans la période sont déjà réservées')
            break
          }
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    }

    return errors
  }, [startDate, endDate, product, reservedDates])

  // Calculate duration and cost
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  }, [startDate, endDate])

  const totalCost = useMemo(() => {
    if (!duration || !product.priceCredits) return 0
    return duration * product.priceCredits
  }, [duration, product.priceCredits])

  // Check if form is valid
  const isValid = useMemo(() => {
    const valid = !!startDate && !!endDate && validationErrors.length === 0
    if (onValidationChange) {
      onValidationChange(valid)
    }
    return valid
  }, [startDate, endDate, validationErrors, onValidationChange])

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="p-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jours de sortie autorisés :</span>
            <span className="font-medium">{getAllowedDaysNames(product.section.allowedDaysOut)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Jours de retour autorisés :</span>
            <span className="font-medium">{getAllowedDaysNames(product.section.allowedDaysIn)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Durée min/max :</span>
            <span className="font-medium">
              {product.minDuration} - {product.maxDuration} jours
            </span>
          </div>
        </div>
      </Card>

      {/* Date Inputs */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Date de sortie *</Label>
          <input
            type="date"
            id="startDate"
            value={formatDateForInput(startDate)}
            onChange={(e) => {
              const date = parseDateFromInput(e.target.value)
              onStartDateChange(date)
            }}
            min={new Date().toISOString().split('T')[0]}
            autoComplete="off"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Date de retour *</Label>
          <input
            type="date"
            id="endDate"
            value={formatDateForInput(endDate)}
            onChange={(e) => {
              const date = parseDateFromInput(e.target.value)
              onEndDateChange(date)
            }}
            min={startDate ? formatDateForInput(new Date(startDate.getTime() + 24 * 60 * 60 * 1000)) : undefined}
            autoComplete="off"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {isValid && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Les dates sélectionnées sont valides
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      {startDate && endDate && duration > 0 && (
        <Card className="bg-primary/5 p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Durée :</span>
              <span>{duration} jour{duration > 1 ? 's' : ''}</span>
            </div>
            {product.priceCredits !== null && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Prix/jour :</span>
                  <span>{product.priceCredits} crédits</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total :</span>
                  <span>{totalCost} crédits</span>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
