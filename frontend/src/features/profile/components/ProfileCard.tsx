import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Phone, Shield, Calendar } from 'lucide-react'
import type { User as UserType } from '@/types'

interface ProfileCardProps {
  user: UserType
}

export function ProfileCard({ user }: ProfileCardProps) {
  // Get the highest priority role
  const primaryRole = user.roles?.[0]
  const roleName = primaryRole?.name || 'User'

  const roleLabels: Record<string, string> = {
    USER: 'Utilisateur',
    GESTIONNAIRE: 'Gestionnaire',
    ADMIN: 'Administrateur',
  }

  const roleVariants: Record<string, 'secondary' | 'default' | 'destructive'> = {
    USER: 'secondary',
    GESTIONNAIRE: 'default',
    ADMIN: 'destructive',
  }

  const roleLabel = roleLabels[roleName] || roleName
  const roleVariant = roleVariants[roleName] || 'secondary'

  const isActive = user.status === 'ACTIVE'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
          <Badge variant={roleVariant}>{roleLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Nom complet</p>
            <p className="font-medium">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="h-3 w-3" /> Email
            </p>
            <p className="font-medium">{user.email}</p>
          </div>
          {user.phone && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telephone
              </p>
              <p className="font-medium">{user.phone}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" /> Statut du compte
            </p>
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? 'Actif' : 'Inactif'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Membre depuis
            </p>
            <p className="font-medium">
              {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
