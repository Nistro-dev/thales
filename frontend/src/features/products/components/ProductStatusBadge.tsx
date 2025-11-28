import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProductStatus } from '@/types'

interface ProductStatusBadgeProps {
  status: ProductStatus
  className?: string
}

const statusConfig: Record<
  ProductStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  AVAILABLE: { label: 'Disponible', variant: 'default' },
  UNAVAILABLE: { label: 'Indisponible', variant: 'secondary' },
  MAINTENANCE: { label: 'Maintenance', variant: 'destructive' },
  ARCHIVED: { label: 'Archivé', variant: 'outline' },
}

export function ProductStatusBadge({ status, className }: ProductStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  )
}
