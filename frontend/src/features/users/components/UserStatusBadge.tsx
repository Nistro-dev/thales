import { Badge } from '@/components/ui/badge'
import type { UserStatus } from '@/api/users.api'
import { getUserStatusLabel, getUserStatusColor } from '../utils/userHelpers'

interface UserStatusBadgeProps {
  status: UserStatus
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getUserStatusColor(status)}>
      {getUserStatusLabel(status)}
    </Badge>
  )
}
