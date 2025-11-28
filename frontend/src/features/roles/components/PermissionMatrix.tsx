import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermissions } from '../hooks/useRoles'
import { applyPermissionHierarchy, isPermissionRequired } from '../utils/roleHelpers'
import { cn } from '@/lib/utils'
import {
  Home,
  Users,
  CreditCard,
  Shield,
  Mail,
  FileText,
  FolderTree,
  Package,
  Calendar,
  BarChart3,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react'

interface PermissionMatrixProps {
  selectedPermissions: string[]
  onChange: (permissions: string[]) => void
  disabled?: boolean
}

// Map category keys to icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  admin: Home,
  users: Users,
  credits: CreditCard,
  cautions: ShieldAlert,
  roles: Shield,
  invitations: Mail,
  audit: FileText,
  files: FileText,
  sections: FolderTree,
  products: Package,
  reservations: Calendar,
  statistics: BarChart3,
}

// Map category keys to French labels
const CATEGORY_LABELS: Record<string, string> = {
  admin: 'Admin Panel',
  users: 'Utilisateurs',
  credits: 'Crédits',
  cautions: 'Cautions',
  roles: 'Rôles',
  invitations: 'Invitations',
  audit: 'Audit',
  files: 'Fichiers',
  sections: 'Sections',
  products: 'Produits',
  reservations: 'Réservations',
  statistics: 'Statistiques',
}

// Permission display names in French
const PERMISSION_DISPLAY_NAMES: Record<string, string> = {
  VIEW_ADMIN_PANEL: 'Accès au panneau admin',
  VIEW_USERS: 'Voir les utilisateurs',
  MANAGE_USERS: 'Gérer les utilisateurs',
  VIEW_CREDITS: 'Voir les crédits',
  MANAGE_CREDITS: 'Gérer les crédits',
  VIEW_CAUTIONS: 'Voir les cautions',
  MANAGE_CAUTIONS: 'Gérer les cautions',
  VIEW_ROLES: 'Voir les rôles',
  MANAGE_ROLES: 'Gérer les rôles',
  VIEW_INVITATIONS: 'Voir les invitations',
  MANAGE_INVITATIONS: 'Gérer les invitations',
  VIEW_AUDIT_LOGS: "Voir les logs d'audit",
  EXPORT_AUDIT_LOGS: "Exporter les logs d'audit",
  VIEW_FILES: 'Voir les fichiers',
  MANAGE_FILES: 'Gérer les fichiers',
  VIEW_SECTIONS: 'Voir les sections',
  MANAGE_SECTIONS: 'Gérer les sections',
  VIEW_PRODUCTS: 'Voir les produits',
  MANAGE_PRODUCTS: 'Gérer les produits',
  VIEW_RESERVATIONS: 'Voir les réservations',
  MANAGE_RESERVATIONS: 'Gérer les réservations',
  VIEW_STATISTICS: 'Voir les statistiques',
}

export function PermissionMatrix({
  selectedPermissions,
  onChange,
  disabled = false,
}: PermissionMatrixProps) {
  const { data: permissions, isLoading } = usePermissions()

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = applyPermissionHierarchy(selectedPermissions, permission, checked)
    onChange(newPermissions)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  // Group permissions by category
  const groupedPermissions =
    permissions?.reduce(
      (acc, permission) => {
        const category = permission.category
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(permission)
        return acc
      },
      {} as Record<string, typeof permissions>
    ) ?? {}

  // Sort categories in a logical order
  const categoryOrder = [
    'admin',
    'users',
    'credits',
    'cautions',
    'roles',
    'invitations',
    'audit',
    'files',
    'sections',
    'products',
    'reservations',
    'statistics',
  ]

  const sortedCategories = Object.keys(groupedPermissions).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a)
    const indexB = categoryOrder.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div className="space-y-3">
      {sortedCategories.map((category) => {
        const categoryPermissions = groupedPermissions[category] || []
        const Icon = CATEGORY_ICONS[category] || Shield
        const label = CATEGORY_LABELS[category] || category
        const selectedInCategory = categoryPermissions.filter((p) =>
          selectedPermissions.includes(p.key)
        )

        return (
          <Card key={category} className="overflow-hidden">
            <CardHeader className="py-2 px-4 bg-muted/50">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {label}
                {selectedInCategory.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedInCategory.length}/{categoryPermissions.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4">
              <div className="space-y-1">
                {categoryPermissions.map((permission) => {
                  const isChecked = selectedPermissions.includes(permission.key)
                  const isRequired = isPermissionRequired(permission.key, selectedPermissions)
                  const isManagePermission =
                    permission.key.startsWith('MANAGE_') || permission.key === 'EXPORT_AUDIT_LOGS'

                  return (
                    <div
                      key={permission.id}
                      className={cn(
                        'flex items-center space-x-3 py-1',
                        isManagePermission && 'ml-4'
                      )}
                    >
                      <Checkbox
                        id={permission.key}
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handlePermissionChange(permission.key, checked === true)
                        }
                        disabled={disabled || isRequired}
                      />
                      <Label
                        htmlFor={permission.key}
                        className={cn(
                          'text-sm cursor-pointer',
                          disabled && 'cursor-not-allowed opacity-50',
                          isRequired && 'text-muted-foreground'
                        )}
                      >
                        {PERMISSION_DISPLAY_NAMES[permission.key] || permission.name}
                        {isRequired && (
                          <span className="text-xs text-muted-foreground ml-2">(requis)</span>
                        )}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
