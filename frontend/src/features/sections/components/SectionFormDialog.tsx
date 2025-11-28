import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateSection, useUpdateSection } from '../hooks/useSectionsAdmin'
import type { Section } from '@/types'

// Schema
const sectionSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  description: z.string().max(500).optional(),
  allowedDaysIn: z.array(z.number()).default([1, 2, 3, 4, 5]),
  allowedDaysOut: z.array(z.number()).default([1, 2, 3, 4, 5]),
})

type SectionFormData = z.infer<typeof sectionSchema>

interface SectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  section?: Section | null
}

const DAYS = [
  { value: 0, label: 'Dim' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
]

export function SectionFormDialog({ open, onOpenChange, section }: SectionFormDialogProps) {
  const createSection = useCreateSection()
  const updateSection = useUpdateSection()
  const isEditing = !!section

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: '',
      description: '',
      allowedDaysIn: [1, 2, 3, 4, 5],
      allowedDaysOut: [1, 2, 3, 4, 5],
    },
  })

  const allowedDaysIn = watch('allowedDaysIn')
  const allowedDaysOut = watch('allowedDaysOut')

  useEffect(() => {
    if (section) {
      reset({
        name: section.name,
        description: section.description || '',
        allowedDaysIn: section.allowedDaysIn || [1, 2, 3, 4, 5],
        allowedDaysOut: section.allowedDaysOut || [1, 2, 3, 4, 5],
      })
    } else {
      reset({
        name: '',
        description: '',
        allowedDaysIn: [1, 2, 3, 4, 5],
        allowedDaysOut: [1, 2, 3, 4, 5],
      })
    }
  }, [section, reset])

  const toggleDay = (field: 'allowedDaysIn' | 'allowedDaysOut', day: number) => {
    const current = field === 'allowedDaysIn' ? allowedDaysIn : allowedDaysOut
    if (current.includes(day)) {
      setValue(
        field,
        current.filter((d) => d !== day)
      )
    } else {
      setValue(field, [...current, day].sort())
    }
  }

  const onSubmit = async (data: SectionFormData) => {
    try {
      if (isEditing && section) {
        await updateSection.mutateAsync({ id: section.id, data })
      } else {
        await createSection.mutateAsync(data)
      }
      onOpenChange(false)
    } catch {
      // Error handled in hook
    }
  }

  const isPending = createSection.isPending || updateSection.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier la section' : 'Nouvelle section'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Photo, Vidéo, Son..."
              disabled={isPending}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description de la section (optionnel)"
              disabled={isPending}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Jours autorisés pour récupération</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label
                  key={`in-${day.value}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={allowedDaysIn.includes(day.value)}
                    onCheckedChange={() => toggleDay('allowedDaysIn', day.value)}
                    disabled={isPending}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Jours autorisés pour retour</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <label
                  key={`out-${day.value}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={allowedDaysOut.includes(day.value)}
                    onCheckedChange={() => toggleDay('allowedDaysOut', day.value)}
                    disabled={isPending}
                  />
                  <span className="text-sm">{day.label}</span>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
