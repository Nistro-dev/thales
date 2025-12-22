import { useNavigate } from 'react-router-dom'
import { MoreHorizontal, Eye, Ban, UserX, UserCheck, Coins } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { UserStatusBadge } from './UserStatusBadge'
import { CautionStatusBadge } from './CautionStatusBadge'
import { formatUserName, formatDateTime } from '../utils/userHelpers'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/constants/permissions'
import type { UserListItem } from '@/api/users.api'

interface UserTableProps {
  users: UserListItem[]
  isLoading: boolean
  onSuspend: (user: UserListItem) => void
  onDisable: (user: UserListItem) => void
  onReactivate: (user: UserListItem) => void
  onAdjustCredits: (user: UserListItem) => void
}

export function UserTable({
  users,
  isLoading,
  onSuspend,
  onDisable,
  onReactivate,
  onAdjustCredits,
}: UserTableProps) {
  const navigate = useNavigate()
  const { hasPermission } = useAuthStore()

  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS)
  const canManageCredits = hasPermission(PERMISSIONS.MANAGE_CREDITS)

  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Caution</TableHead>
              <TableHead className="text-right">Crédits</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-48" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Aucun utilisateur trouvé
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Caution</TableHead>
            <TableHead className="text-right">Crédits</TableHead>
            <TableHead>Dernière connexion</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/admin/users/${user.id}`)}
            >
              <TableCell className="font-medium">
                {formatUserName(user.firstName, user.lastName)}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>
                <UserStatusBadge status={user.status} />
              </TableCell>
              <TableCell>
                <CautionStatusBadge status={user.cautionStatus} />
              </TableCell>
              <TableCell className="text-right font-medium">{user.creditBalance}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(user.lastLoginAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/admin/users/${user.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </DropdownMenuItem>

                    {canManageCredits && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          onAdjustCredits(user)
                        }}
                      >
                        <Coins className="h-4 w-4 mr-2" />
                        Ajuster crédits
                      </DropdownMenuItem>
                    )}

                    {canManageUsers && (
                      <>
                        <DropdownMenuSeparator />

                        {user.status === 'ACTIVE' && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onSuspend(user)
                              }}
                              className="text-orange-600"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspendre
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onDisable(user)
                              }}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          </>
                        )}
                        {user.status === 'SUSPENDED' && (
                          <>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onReactivate(user)
                              }}
                              className="text-green-600"
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Réactiver
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                onDisable(user)
                              }}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                          </>
                        )}
                        {user.status === 'DISABLED' && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              onReactivate(user)
                            }}
                            className="text-green-600"
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Réactiver
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
