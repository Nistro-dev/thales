import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Minus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useAdjustCredits } from '../hooks/useUsers'
import type { UserListItem, UserDetail } from '@/api/users.api'

const creditAdjustmentSchema = z.object({
  amount: z.number().min(1, 'Le montant doit être supérieur à 0'),
  reason: z.string().min(1, 'La raison est requise'),
})

type CreditAdjustmentFormData = z.infer<typeof creditAdjustmentSchema>

interface CreditAdjustmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserListItem | UserDetail | null
}

export function CreditAdjustmentDialog({
  open,
  onOpenChange,
  user,
}: CreditAdjustmentDialogProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add')
  const adjustCredits = useAdjustCredits()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreditAdjustmentFormData>({
    resolver: zodResolver(creditAdjustmentSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  })

  const amount = watch('amount') || 0
  const newBalance = user
    ? adjustmentType === 'add'
      ? user.creditBalance + amount
      : user.creditBalance - amount
    : 0

  const onSubmit = async (data: CreditAdjustmentFormData) => {
    if (!user) return

    try {
      await adjustCredits.mutateAsync({
        id: user.id,
        data: {
          amount: adjustmentType === 'add' ? data.amount : -data.amount,
          reason: data.reason,
        },
      })
      reset()
      setAdjustmentType('add')
      onOpenChange(false)
    } catch {
      // Error handled in hook
    }
  }

  const handleClose = () => {
    reset()
    setAdjustmentType('add')
    onOpenChange(false)
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuster les crédits</DialogTitle>
          <DialogDescription>
            Ajuster les crédits de {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Solde actuel</p>
            <p className="text-2xl font-bold">{user.creditBalance} crédits</p>
          </div>

          <div className="space-y-2">
            <Label>Type d'ajustement</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(v) => setAdjustmentType(v as 'add' | 'remove')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="flex items-center gap-1 cursor-pointer">
                  <Plus className="h-4 w-4 text-green-600" />
                  Ajouter
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" />
                <Label htmlFor="remove" className="flex items-center gap-1 cursor-pointer">
                  <Minus className="h-4 w-4 text-red-600" />
                  Retirer
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant *</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              {...register('amount', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Raison *</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="Ex: Bonus de fidélité, Correction d'erreur..."
              rows={3}
            />
            {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
          </div>

          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Nouveau solde</p>
            <p
              className={`text-2xl font-bold ${
                newBalance < 0 ? 'text-red-600' : newBalance > user.creditBalance ? 'text-green-600' : ''
              }`}
            >
              {newBalance} crédits
            </p>
            {newBalance < 0 && (
              <p className="text-sm text-red-500 mt-1">
                Attention: le solde sera négatif
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || adjustCredits.isPending}>
              {adjustCredits.isPending ? 'Ajustement...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
