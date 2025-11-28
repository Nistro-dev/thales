import { AlertTriangle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useUpdateUserStatus } from '../hooks/useUsers'
import type { UserListItem, UserDetail } from '@/api/users.api'

interface SuspendUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserListItem | UserDetail | null
}

export function SuspendUserDialog({ open, onOpenChange, user }: SuspendUserDialogProps) {
  const updateStatus = useUpdateUserStatus()

  const handleSuspend = async () => {
    if (!user) return

    try {
      await updateStatus.mutateAsync({ id: user.id, status: 'SUSPENDED' })
      onOpenChange(false)
    } catch {
      // Error handled in hook
    }
  }

  if (!user) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <AlertDialogTitle>Suspendre l'utilisateur</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Êtes-vous sûr de vouloir suspendre{' '}
                <strong className="text-foreground">
                  {user.firstName} {user.lastName}
                </strong>{' '}
                ?
              </p>
              <p>L'utilisateur ne pourra plus :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Se connecter à son compte</li>
                <li>Effectuer de nouvelles réservations</li>
                <li>Accéder à ses réservations en cours</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSuspend}
            disabled={updateStatus.isPending}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {updateStatus.isPending ? 'Suspension...' : 'Suspendre'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
