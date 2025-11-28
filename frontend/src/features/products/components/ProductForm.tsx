import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSections } from '@/features/products/hooks/useSections'
import type { Product } from '@/types'

// Schema
const productSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  reference: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
  priceCredits: z.coerce.number().min(0, 'Le prix doit être positif'),
  minDuration: z.coerce.number().min(1, 'Minimum 1 jour').default(1),
  maxDuration: z.coerce.number().min(1, 'Minimum 1 jour').default(14),
  sectionId: z.string().min(1, 'La section est requise'),
  subSectionId: z.string().optional(),
  attributes: z
    .array(
      z.object({
        key: z.string().min(1, 'La clé est requise'),
        value: z.string().min(1, 'La valeur est requise'),
      })
    )
    .optional(),
})

export type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function ProductForm({ product, onSubmit, onCancel, isSubmitting }: ProductFormProps) {
  const { data: sections } = useSections()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      reference: '',
      description: '',
      priceCredits: 0,
      minDuration: 1,
      maxDuration: 14,
      sectionId: '',
      subSectionId: '',
      attributes: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'attributes',
  })

  const selectedSectionId = watch('sectionId')
  const selectedSection = sections?.find((s) => s.id === selectedSectionId)
  const subSections = selectedSection?.subSections || []

  // Reset form when product changes (wait for sections to be loaded)
  useEffect(() => {
    if (product && sections && sections.length > 0) {
      reset({
        name: product.name,
        reference: product.reference || '',
        description: product.description || '',
        priceCredits: product.priceCredits ?? 0,
        minDuration: product.minDuration,
        maxDuration: product.maxDuration,
        sectionId: product.sectionId,
        subSectionId: product.subSectionId || '',
        attributes:
          product.attributes?.map((attr) => ({
            key: attr.key,
            value: attr.value,
          })) || [],
      })
    } else if (!product) {
      reset({
        name: '',
        reference: '',
        description: '',
        priceCredits: 0,
        minDuration: 1,
        maxDuration: 14,
        sectionId: '',
        subSectionId: '',
        attributes: [],
      })
    }
  }, [product, sections, reset])

  // Reset subsection when section changes
  useEffect(() => {
    if (selectedSectionId !== product?.sectionId) {
      setValue('subSectionId', '')
    }
  }, [selectedSectionId, product?.sectionId, setValue])

  const handleFormSubmit = handleSubmit(async (data) => {
    // Clean up empty subSectionId
    const cleanedData = {
      ...data,
      subSectionId: data.subSectionId || undefined,
      reference: data.reference || undefined,
      description: data.description || undefined,
      attributes: data.attributes?.filter((attr) => attr.key && attr.value),
    }
    await onSubmit(cleanedData)
  })

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Nom du produit"
            disabled={isSubmitting}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference">Référence</Label>
          <Input
            id="reference"
            {...register('reference')}
            placeholder="Ex: CAN-5D-MK4"
            disabled={isSubmitting}
          />
          {errors.reference && (
            <p className="text-sm text-destructive">{errors.reference.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Description du produit"
          disabled={isSubmitting}
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Section & SubSection */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Section *</Label>
          <Select
            value={selectedSectionId}
            onValueChange={(value) => setValue('sectionId', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une section" />
            </SelectTrigger>
            <SelectContent>
              {sections?.map((section) => (
                <SelectItem key={section.id} value={section.id}>
                  {section.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sectionId && (
            <p className="text-sm text-destructive">{errors.sectionId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Sous-section</Label>
          <Select
            value={watch('subSectionId') || 'none'}
            onValueChange={(value) => setValue('subSectionId', value === 'none' ? '' : value)}
            disabled={isSubmitting || subSections.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une sous-section" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              {subSections.map((sub) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pricing & Duration */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="priceCredits">Prix (crédits/jour) *</Label>
          <Input
            id="priceCredits"
            type="number"
            min="0"
            {...register('priceCredits')}
            disabled={isSubmitting}
          />
          {errors.priceCredits && (
            <p className="text-sm text-destructive">{errors.priceCredits.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="minDuration">Durée min (jours)</Label>
          <Input
            id="minDuration"
            type="number"
            min="1"
            {...register('minDuration')}
            disabled={isSubmitting}
          />
          {errors.minDuration && (
            <p className="text-sm text-destructive">{errors.minDuration.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxDuration">Durée max (jours)</Label>
          <Input
            id="maxDuration"
            type="number"
            min="1"
            {...register('maxDuration')}
            disabled={isSubmitting}
          />
          {errors.maxDuration && (
            <p className="text-sm text-destructive">{errors.maxDuration.message}</p>
          )}
        </div>
      </div>

      {/* Attributes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Attributs personnalisés</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ key: '', value: '' })}
            disabled={isSubmitting}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>

        {fields.length > 0 && (
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  {...register(`attributes.${index}.key`)}
                  placeholder="Clé (ex: Capteur)"
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Input
                  {...register(`attributes.${index}.value`)}
                  placeholder="Valeur (ex: Full Frame)"
                  disabled={isSubmitting}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={isSubmitting}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Aucun attribut. Cliquez sur "Ajouter" pour créer des caractéristiques personnalisées.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {product ? 'Enregistrer' : 'Créer'}
        </Button>
      </div>
    </form>
  )
}
