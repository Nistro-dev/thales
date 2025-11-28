/**
 * Format a number with thousands separator
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR').format(value)
}

/**
 * Format a percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * Get color class for alert severity
 */
export function getAlertSeverityColor(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high':
      return 'text-red-500 bg-red-50 border-red-200'
    case 'medium':
      return 'text-orange-500 bg-orange-50 border-orange-200'
    case 'low':
      return 'text-green-500 bg-green-50 border-green-200'
    default:
      return 'text-muted-foreground bg-muted'
  }
}

/**
 * Get icon color for alert severity
 */
export function getAlertIconColor(severity: 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'high':
      return 'text-red-500'
    case 'medium':
      return 'text-orange-500'
    case 'low':
      return 'text-green-500'
    default:
      return 'text-muted-foreground'
  }
}

/**
 * Get badge variant for alert severity
 */
export function getAlertBadgeVariant(
  severity: 'high' | 'medium' | 'low'
): 'destructive' | 'default' | 'secondary' | 'outline' {
  switch (severity) {
    case 'high':
      return 'destructive'
    case 'medium':
      return 'default'
    case 'low':
      return 'secondary'
    default:
      return 'outline'
  }
}

/**
 * Get date range for common periods
 */
export function getDateRange(
  period: 'today' | 'week' | 'month' | 'quarter' | 'year'
): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0]

  let from: Date

  switch (period) {
    case 'today':
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      break
    case 'week':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      from = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'quarter':
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      from = new Date(now.getFullYear(), 0, 1)
      break
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return {
    from: from.toISOString().split('T')[0],
    to,
  }
}

/**
 * Format a date string to French locale
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

/**
 * Format a date string to short format (dd/mm)
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
}
