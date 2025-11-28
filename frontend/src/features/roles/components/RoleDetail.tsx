import { Link } from 'react-router-dom'
import { Check, Crown, Shield, User, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { RoleDetail as RoleDetailType } from '@/api/roles.api'
import {
  PERMISSION_CATEGORIES,
  getPermissionDisplayName,
  getRoleBadgeVariant,
} from '../utils/roleHelpers'
import { ROUTES } from '@/constants/routes'

interface RoleDetailProps {
  role: RoleDetailType | undefined
  isLoading?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

function getRoleIcon(role: RoleDetailType) {
  if (role.name === 'Super Admin') return Crown
  if (role.isSystem) return Shield
  return User
}

export function RoleDetail({ role, isLoading, onEdit, onDelete }: RoleDetailProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!role) {
    return (
      <div className="text-center py-8 text-muted-foreground">Rôle introuvable</div>
    )
  }

  const RoleIcon = getRoleIcon(role)
  const badgeVariant = getRoleBadgeVariant(role)
  const canEdit = !role.isSystem
  const canDelete = !role.isSystem && role.users.length === 0

  // Group permissions by category for display
  const permissionsByCategory = PERMISSION_CATEGORIES.map((category) => ({
    ...category,
    activePermissions: category.permissions.filter((p) => role.permissions.includes(p as typeof role.permissions[number])),
  })).filter((cat) => cat.activePermissions.length > 0)

  return (
    <div className="space-y-6">
      {/* Role Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <RoleIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold">{role.name}</h2>
                  {role.isSystem && (
                    <Badge variant="outline">Système</Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-muted-foreground mt-1">{role.description}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span>
                    Créé le{' '}
                    {new Date(role.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{role.users.length} utilisateur(s)</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" onClick={onEdit}>
                  Modifier
                </Button>
              )}
              {canDelete && (
                <Button variant="destructive" onClick={onDelete}>
                  Supprimer
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions ({role.permissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {role.permissions.length === 23 ? (
            <Badge variant={badgeVariant} className="text-sm">
              Toutes les permissions
            </Badge>
          ) : (
            <div className="space-y-4">
              {permissionsByCategory.map((category) => {
                const Icon = category.icon
                return (
                  <div key={category.key}>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                      <Icon className="h-4 w-4" />
                      {category.label}
                    </div>
                    <div className="flex flex-wrap gap-2 ml-6">
                      {category.activePermissions.map((permission) => (
                        <div
                          key={permission}
                          className="flex items-center gap-1 text-sm bg-muted px-2 py-1 rounded"
                        >
                          <Check className="h-3 w-3 text-green-600" />
                          {getPermissionDisplayName(permission)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Utilisateurs avec ce rôle ({role.users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {role.users.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun utilisateur n'a ce rôle
            </p>
          ) : (
            <div className="space-y-2">
              {role.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    {user.section && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Section: {user.section.name}
                      </Badge>
                    )}
                  </div>
                  {user.id && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={ROUTES.ADMIN_USER_DETAIL.replace(':id', user.id)}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Voir
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
