import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useDeleteNotification } from '../hooks/useNotifications'
import type { Notification, NotificationType } from '@/api/notifications.api'

const typeLabels: Record<NotificationType, string> = {
  RESERVATION_CONFIRMED: 'Reservation confirmee',
  RESERVATION_CANCELLED: 'Reservation annulee',
  RESERVATION_REFUNDED: 'Reservation remboursee',
  RESERVATION_CHECKOUT: 'Produit retire',
  RESERVATION_RETURN: 'Produit retourne',
  RESERVATION_REMINDER: 'Rappel',
  RESERVATION_EXTENDED: 'Reservation prolongee',
  RESERVATION_OVERDUE: 'Retard',
  RESERVATION_EXPIRED: 'Reservation expiree',
  CREDIT_ADDED: 'Credits ajoutes',
  CREDIT_REMOVED: 'Credits retires',
  ACCOUNT_ACTIVATED: 'Compte active',
  PASSWORD_CHANGED: 'Mot de passe modifie',
}

interface NotificationDetailModalProps {
  notification: Notification | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationDetailModal({
  notification,
  open,
  onOpenChange,
}: NotificationDetailModalProps) {
  const deleteNotification = useDeleteNotification()

  if (!notification) return null

  const handleDelete = async () => {
    await deleteNotification.mutateAsync(notification.id)
    onOpenChange(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle>{notification.title}</DialogTitle>
              <DialogDescription>{formatDate(notification.createdAt)}</DialogDescription>
            </div>
            <Badge variant={notification.read ? 'secondary' : 'default'}>
              {notification.read ? 'Lu' : 'Non lu'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Type</p>
            <Badge variant="outline">{typeLabels[notification.type] || notification.type}</Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1">Message</p>
            <p className="text-sm">{notification.message}</p>
          </div>

          {notification.metadata && Object.keys(notification.metadata).length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Details</p>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                {JSON.stringify(notification.metadata, null, 2)}
              </pre>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteNotification.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
