import { Badge } from '@/components/ui/badge'
import type { CautionStatus } from '@/api/users.api'
import { getCautionStatusLabel, getCautionStatusColor } from '../utils/userHelpers'

interface CautionStatusBadgeProps {
  status: CautionStatus
}

export function CautionStatusBadge({ status }: CautionStatusBadgeProps) {
  return (
    <Badge variant="outline" className={getCautionStatusColor(status)}>
      {getCautionStatusLabel(status)}
    </Badge>
  )
}
