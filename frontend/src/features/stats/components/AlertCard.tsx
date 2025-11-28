import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Clock, Package, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAlertIconColor, getAlertBadgeVariant } from '../utils/statsHelpers'
import type { Alerts, Alert } from '@/api/stats.api'

interface AlertCardProps {
  alerts?: Alerts
  isLoading?: boolean
}

function AlertItem({ alert, icon: Icon, label }: { alert: Alert; icon: React.ElementType; label: string }) {
  if (alert.count === 0) return null

  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Icon className={cn('h-5 w-5', getAlertIconColor(alert.severity))} />
        <div>
          <p className="text-sm font-medium">{label}</p>
          {alert.items.length > 0 && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {alert.items[0].name}
              {alert.items.length > 1 && ` et ${alert.items.length - 1} autres`}
            </p>
          )}
        </div>
      </div>
      <Badge variant={getAlertBadgeVariant(alert.severity)}>{alert.count}</Badge>
    </div>
  )
}

export function AlertCard({ alerts, isLoading }: AlertCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasAlerts =
    alerts &&
    (alerts.overdueReservations.count > 0 ||
      alerts.damagedProducts.count > 0 ||
      alerts.usersLowCredits.count > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alertes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasAlerts ? (
          <p className="text-sm text-muted-foreground text-center py-4">Aucune alerte</p>
        ) : (
          <div className="space-y-1">
            {alerts && (
              <>
                <AlertItem
                  alert={alerts.overdueReservations}
                  icon={Clock}
                  label="Retours en retard"
                />
                <AlertItem
                  alert={alerts.damagedProducts}
                  icon={Package}
                  label="Produits endommagés"
                />
                <AlertItem
                  alert={alerts.usersLowCredits}
                  icon={Coins}
                  label="Utilisateurs crédits faibles"
                />
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
