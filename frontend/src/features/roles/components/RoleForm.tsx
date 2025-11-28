import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PermissionMatrix } from './PermissionMatrix'
import type { Role } from '@/api/roles.api'

const roleSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Sélectionnez au moins une permission'),
})

type RoleFormData = z.infer<typeof roleSchema>

interface RoleFormProps {
  role?: Role
  onSubmit: (data: RoleFormData) => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
}

export function RoleForm({ role, onSubmit, onCancel, isSubmitting }: RoleFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      description: role?.description || '',
      permissions: role?.permissions || [],
    },
  })

  const selectedPermissions = watch('permissions')

  const handlePermissionsChange = (permissions: string[]) => {
    setValue('permissions', permissions, { shouldValidate: true })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom du rôle *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="Ex: Manager Section Photo"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Description du rôle (optionnel)"
            rows={2}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Permissions *</Label>
          <span className="text-sm text-muted-foreground">
            {selectedPermissions.length} sélectionnée(s)
          </span>
        </div>
        {errors.permissions && (
          <p className="text-sm text-destructive">{errors.permissions.message}</p>
        )}
        <PermissionMatrix
          selectedPermissions={selectedPermissions}
          onChange={handlePermissionsChange}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : role ? 'Mettre à jour' : 'Créer le rôle'}
        </Button>
      </div>
    </form>
  )
}
