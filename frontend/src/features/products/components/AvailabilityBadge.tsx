import type { ProductStatus } from '@/types'
import { cn } from '@/lib/utils'

interface AvailabilityBadgeProps {
  status: ProductStatus
  className?: string
}

const statusConfig: Record<ProductStatus, { label: string; className: string }> = {
  AVAILABLE: {
    label: 'Disponible',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  UNAVAILABLE: {
    label: 'Indisponible',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  MAINTENANCE: {
    label: 'En maintenance',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  ARCHIVED: {
    label: 'Archivé',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  },
}

export function AvailabilityBadge({ status, className }: AvailabilityBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
