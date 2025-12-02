import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Coins,
  Edit,
  Ban,
  UserX,
  UserCheck,
  Clock,
  Pencil,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  UserStatusBadge,
  CautionStatusBadge,
  EditUserDialog,
  CreditAdjustmentDialog,
  SuspendUserDialog,
  UserReservationsTable,
  CreditTransactionsTable,
  UserRolesCard,
} from '../components'
import {
  useUser,
  useUserReservations,
  useUserCreditTransactions,
  useDisableUser,
  useReactivateUser,
  useValidateCaution,
  useExemptCaution,
  useResetCaution,
} from '../hooks/useUsers'
import { formatDateTime } from '../utils/userHelpers'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/constants/permissions'

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { hasPermission } = useAuthStore()

  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS)
  const canManageCredits = hasPermission(PERMISSIONS.MANAGE_CREDITS)
  const canManageCautions = hasPermission(PERMISSIONS.MANAGE_CAUTIONS)
  const canManageRoles = hasPermission(PERMISSIONS.MANAGE_ROLES)

  // Pagination states
  const [reservationsPage, setReservationsPage] = useState(1)
  const [reservationsLimit, setReservationsLimit] = useState(10)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [transactionsLimit, setTransactionsLimit] = useState(10)

  // Fetch data
  const { data: userData, isLoading: isLoadingUser } = useUser(id)
  const { data: reservationsData, isLoading: isLoadingReservations } = useUserReservations(
    id,
    reservationsPage,
    reservationsLimit
  )
  const { data: transactionsData, isLoading: isLoadingTransactions } = useUserCreditTransactions(
    id,
    transactionsPage,
    transactionsLimit
  )

  // Mutations
  const disableUser = useDisableUser()
  const reactivateUser = useReactivateUser()
  const validateCaution = useValidateCaution()
  const exemptCaution = useExemptCaution()
  const resetCaution = useResetCaution()

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

  const user = userData?.user

  // Calculate approximate total for pagination (backend doesn't return total)
  const reservationsCount = reservationsData?.reservations?.length || 0
  const reservationsTotal = reservationsCount === reservationsLimit
    ? reservationsLimit * reservationsPage + 1
    : (reservationsPage - 1) * reservationsLimit + reservationsCount

  const transactionsCount = transactionsData?.transactions?.length || 0
  const transactionsTotal = transactionsCount === transactionsLimit
    ? transactionsLimit * transactionsPage + 1
    : (transactionsPage - 1) * transactionsLimit + transactionsCount

  if (isLoadingUser) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Utilisateur introuvable</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/users')}>
            Retour à la liste
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageCredits && (
            <Button variant="outline" onClick={() => setCreditDialogOpen(true)}>
              <Coins className="h-4 w-4 mr-2" />
              Ajuster crédits
            </Button>
          )}

          {canManageUsers && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Modifier les infos
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {user.status === 'ACTIVE' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setSuspendDialogOpen(true)}
                      className="text-orange-600"
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspendre
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => disableUser.mutate(user.id)}
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
                      onClick={() => reactivateUser.mutate(user.id)}
                      className="text-green-600"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Réactiver
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => disableUser.mutate(user.id)}
                      className="text-red-600"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Désactiver
                    </DropdownMenuItem>
                  </>
                )}

                {user.status === 'DISABLED' && (
                  <DropdownMenuItem
                    onClick={() => reactivateUser.mutate(user.id)}
                    className="text-green-600"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Réactiver
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{user.phone || <span className="text-muted-foreground italic">Non renseigné</span>}</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Statut:</span>
              <UserStatusBadge status={user.status} />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">Caution:</span>
              <CautionStatusBadge status={user.cautionStatus} />
              {canManageCautions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Modifier
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {user.cautionStatus !== 'VALIDATED' && (
                      <DropdownMenuItem onClick={() => validateCaution.mutate(user.id)}>
                        Valider la caution
                      </DropdownMenuItem>
                    )}
                    {user.cautionStatus !== 'EXEMPTED' && (
                      <DropdownMenuItem onClick={() => exemptCaution.mutate(user.id)}>
                        Exempter de caution
                      </DropdownMenuItem>
                    )}
                    {user.cautionStatus !== 'PENDING' && (
                      <DropdownMenuItem onClick={() => resetCaution.mutate(user.id)}>
                        Réinitialiser
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Inscrit le {formatDateTime(user.createdAt)}
              </span>
            </div>

            {user.lastLoginAt && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Dernière connexion: {formatDateTime(user.lastLoginAt)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Crédits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <p className="text-5xl font-bold">{user.creditBalance}</p>
              <p className="text-muted-foreground mt-2">crédits disponibles</p>
            </div>

            {canManageCredits && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" onClick={() => setCreditDialogOpen(true)}>
                  Ajuster les crédits
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Roles Card */}
      <UserRolesCard
        userId={user.id}
        roles={user.roles || []}
        canManageRoles={canManageRoles}
      />

      {/* Reservations */}
      <UserReservationsTable
        reservations={reservationsData?.reservations}
        isLoading={isLoadingReservations}
        page={reservationsPage}
        limit={reservationsLimit}
        total={reservationsTotal}
        onPageChange={setReservationsPage}
        onLimitChange={(newLimit) => {
          setReservationsLimit(newLimit)
          setReservationsPage(1)
        }}
      />

      {/* Credit Transactions */}
      <CreditTransactionsTable
        transactions={transactionsData?.transactions}
        isLoading={isLoadingTransactions}
        page={transactionsPage}
        limit={transactionsLimit}
        total={transactionsTotal}
        onPageChange={setTransactionsPage}
        onLimitChange={(newLimit) => {
          setTransactionsLimit(newLimit)
          setTransactionsPage(1)
        }}
      />

      {/* Dialogs */}
      <EditUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={user}
      />

      <CreditAdjustmentDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        user={user}
      />

      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        user={user}
      />
    </div>
  )
}
