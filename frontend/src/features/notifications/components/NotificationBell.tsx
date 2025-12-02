import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUnreadCount } from '../hooks/useNotifications'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { data: unreadCount = 0 } = useUnreadCount()

  return (
    <Button variant="ghost" size="icon" className="relative" asChild>
      <Link to={ROUTES.NOTIFICATIONS}>
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
      </Link>
    </Button>
  )
}
