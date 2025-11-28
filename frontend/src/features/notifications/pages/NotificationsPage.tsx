import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Loader2, CheckCheck, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import { NotificationItem } from '../components/NotificationItem'
import {
  useNotifications,
  useMarkAllAsRead,
  useMarkAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '../hooks/useNotifications'

const ITEMS_PER_PAGE = 20

export function NotificationsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, error } = useNotifications(ITEMS_PER_PAGE, (page - 1) * ITEMS_PER_PAGE)
  const markAllAsRead = useMarkAllAsRead()
  const markAsRead = useMarkAsRead()
  const deleteNotification = useDeleteNotification()
  const deleteAllNotifications = useDeleteAllNotifications()

  const notifications = data?.notifications || []
  const total = data?.total || 0
  const unreadCount = data?.unreadCount || 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const handleNotificationClick = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id)
  }

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id)
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate()
  }

  const handleDeleteAll = () => {
    deleteAllNotifications.mutate()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes vos notifications sont lues'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              {markAllAsRead.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Tout marquer comme lu
            </Button>
          )}
          {total > 0 && (
            <Button
              variant="outline"
              onClick={handleDeleteAll}
              disabled={deleteAllNotifications.isPending}
              className="text-destructive hover:text-destructive"
            >
              {deleteAllNotifications.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Tout supprimer
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {total} notification{total > 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive text-center py-4">
              Erreur lors du chargement des notifications
            </p>
          )}

          {!isLoading && !error && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4" />
              <p className="text-lg">Aucune notification</p>
              <p className="text-sm">Vous n'avez pas encore recu de notifications</p>
            </div>
          )}

          {!isLoading && !error && notifications.length > 0 && (
            <>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() =>
                      !notification.read && handleNotificationClick(notification.id)
                    }
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    showActions={true}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
