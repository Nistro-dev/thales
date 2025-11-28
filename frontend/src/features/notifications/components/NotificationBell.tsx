import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationList } from './NotificationList'
import { useUnreadCount, useNotifications, useMarkAsRead } from '../hooks/useNotifications'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import type { Notification } from '@/api/notifications.api'

const DROPDOWN_LIMIT = 5

export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data } = useNotifications(DROPDOWN_LIMIT, 0)
  const markAsRead = useMarkAsRead()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const hasMore = data && data.total > DROPDOWN_LIMIT

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id)
    }
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium',
                unreadCount > 9 ? 'h-5 w-5 text-[10px]' : 'h-4 w-4'
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <NotificationList
          limit={DROPDOWN_LIMIT}
          onNotificationClick={handleNotificationClick}
          showMarkAllAsRead={true}
          showActions={true}
        />
        {hasMore && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-sm"
                asChild
                size="sm"
              >
                <Link to={ROUTES.NOTIFICATIONS} onClick={() => setDropdownOpen(false)}>
                  Voir toutes les notifications
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
