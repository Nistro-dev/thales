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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import type { ProductCondition } from '@/types'

const conditionLabels: Record<ProductCondition, string> = {
  OK: 'OK - En bon état',
  MINOR_DAMAGE: 'Dommages mineurs',
  MAJOR_DAMAGE: 'Dommages majeurs',
  MISSING_PARTS: 'Pièces manquantes',
  BROKEN: 'Cassé',
}

interface ReturnDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (condition: ProductCondition, notes?: string) => Promise<void>
  productName?: string
  userName?: string
  isLoading?: boolean
}

export function ReturnDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  userName,
  isLoading = false,
}: ReturnDialogProps) {
  const [condition, setCondition] = useState<ProductCondition>('OK')
  const [notes, setNotes] = useState('')

  const handleConfirm = async () => {
    await onConfirm(condition, notes || undefined)
    setCondition('OK')
    setNotes('')
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCondition('OK')
      setNotes('')
    }
    onOpenChange(newOpen)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer le retour</AlertDialogTitle>
          <AlertDialogDescription>
            {productName && userName ? (
              <>
                Vous allez effectuer le retour de <strong>{productName}</strong> par{' '}
                <strong>{userName}</strong>.
              </>
            ) : (
              'Vous allez effectuer le retour du matériel.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condition">État du matériel</Label>
            <Select
              value={condition}
              onValueChange={(value) => setCondition(value as ProductCondition)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez l'état" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(conditionLabels) as [ProductCondition, string][]).map(
                  ([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="return-notes">Notes (optionnel)</Label>
            <Textarea
              id="return-notes"
              placeholder="Ajoutez des notes pour ce retour..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              'Confirmer le retour'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
