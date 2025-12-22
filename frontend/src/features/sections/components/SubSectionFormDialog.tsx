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
import { useCreateSubSection, useUpdateSubSection } from '../hooks/useSectionsAdmin'
import type { SubSection } from '@/types'

// Schema
const subSectionSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  description: z.string().max(500).optional(),
})

type SubSectionFormData = z.infer<typeof subSectionSchema>

interface SubSectionFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sectionId: string
  subSection?: SubSection | null
}

export function SubSectionFormDialog({
  open,
  onOpenChange,
  sectionId,
  subSection,
}: SubSectionFormDialogProps) {
  const createSubSection = useCreateSubSection()
  const updateSubSection = useUpdateSubSection()
  const isEditing = !!subSection

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubSectionFormData>({
    resolver: zodResolver(subSectionSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    if (subSection) {
      reset({
        name: subSection.name,
        description: subSection.description || '',
      })
    } else {
      reset({
        name: '',
        description: '',
      })
    }
  }, [subSection, reset])

  const onSubmit = async (data: SubSectionFormData) => {
    try {
      if (isEditing && subSection) {
        await updateSubSection.mutateAsync({ id: subSection.id, data })
      } else {
        await createSubSection.mutateAsync({ sectionId, data })
      }
      onOpenChange(false)
    } catch {
      // Error handled in hook
    }
  }

  const isPending = createSubSection.isPending || updateSubSection.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la sous-section' : 'Nouvelle sous-section'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ex: Boîtiers, Objectifs..."
              disabled={isPending}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Description de la sous-section (optionnel)"
              disabled={isPending}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
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
