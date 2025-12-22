import { useState, useMemo } from 'react'
import { Users, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserTable,
  UserFilters,
  InviteUserDialog,
  CreditAdjustmentDialog,
  SuspendUserDialog,
} from '../components'
import { useUsers, useDisableUser, useReactivateUser } from '../hooks/useUsers'
import { useAuthStore } from '@/stores/auth.store'
import { PERMISSIONS } from '@/constants/permissions'
import type { UserStatus, CautionStatus, UserListItem } from '@/api/users.api'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function AdminUsersPage() {
  const { hasPermission } = useAuthStore()
  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS)

  // Filters state - default to ACTIVE users
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<UserStatus | 'ALL'>('ACTIVE')
  const [cautionStatus, setCautionStatus] = useState<CautionStatus | ''>('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Build filters object
  const filters = useMemo(
    () => ({
      ...(search && { search }),
      ...(status && status !== 'ALL' && { status }),
      ...(cautionStatus && { cautionStatus }),
      page,
      limit,
    }),
    [search, status, cautionStatus, page, limit]
  )

  // Fetch users
  const { data, isLoading } = useUsers(filters)

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null)
  const [creditDialogOpen, setCreditDialogOpen] = useState(false)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)

  // Mutations
  const disableUser = useDisableUser()
  const reactivateUser = useReactivateUser()

  const handleClearFilters = () => {
    setSearch('')
    setStatus('ACTIVE')
    setCautionStatus('')
    setPage(1)
  }

  const handleSuspend = (user: UserListItem) => {
    setSelectedUser(user)
    setSuspendDialogOpen(true)
  }

  const handleDisable = async (user: UserListItem) => {
    await disableUser.mutateAsync(user.id)
  }

  const handleReactivate = async (user: UserListItem) => {
    await reactivateUser.mutateAsync(user.id)
  }

  const handleAdjustCredits = (user: UserListItem) => {
    setSelectedUser(user)
    setCreditDialogOpen(true)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  // Pagination calculations
  const total = data?.users?.length ?? 0
  const hasMore = total === limit // If we got exactly limit results, there might be more
  const hasNextPage = hasMore
  const hasPrevPage = page > 1

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 sm:h-8 sm:w-8" />
            Utilisateurs
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérer les utilisateurs de la plateforme</p>
        </div>

        {canManageUsers && (
          <Button onClick={() => setInviteDialogOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            Inviter un utilisateur
          </Button>
        )}
      </div>

      {/* Filters */}
      <UserFilters
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        status={status}
        onStatusChange={(value) => {
          setStatus(value)
          setPage(1)
        }}
        cautionStatus={cautionStatus}
        onCautionStatusChange={(value) => {
          setCautionStatus(value)
          setPage(1)
        }}
        onClearFilters={handleClearFilters}
      />

      {/* Users Table */}
      <UserTable
        users={data?.users || []}
        isLoading={isLoading}
        onSuspend={handleSuspend}
        onDisable={handleDisable}
        onReactivate={handleReactivate}
        onAdjustCredits={handleAdjustCredits}
      />

      {/* Pagination */}
      {data?.users && data.users.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Afficher</span>
            <Select
              value={String(limit)}
              onValueChange={(v) => handleLimitChange(Number(v))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>par page</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} />

      <CreditAdjustmentDialog
        open={creditDialogOpen}
        onOpenChange={setCreditDialogOpen}
        user={selectedUser}
      />

      <SuspendUserDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        user={selectedUser}
      />
    </div>
  )
}
