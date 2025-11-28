import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowDownToLine, ArrowUpFromLine, AlertTriangle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { ProductMovement } from '@/api/products.api'
import type { ProductCondition } from '@/types'

interface ProductMovementsListProps {
  movements: ProductMovement[]
  isLoading?: boolean
}

const conditionConfig: Record<
  ProductCondition,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  OK: { label: 'OK', variant: 'default' },
  MINOR_DAMAGE: { label: 'Dégâts mineurs', variant: 'secondary' },
  MAJOR_DAMAGE: { label: 'Dégâts majeurs', variant: 'destructive' },
  MISSING_PARTS: { label: 'Pièces manquantes', variant: 'destructive' },
  BROKEN: { label: 'Cassé', variant: 'destructive' },
}

export function ProductMovementsList({ movements, isLoading }: ProductMovementsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Aucun mouvement enregistré
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {movements.map((movement) => {
        const isCheckout = movement.type === 'CHECKOUT'
        const user = movement.reservation?.user
        const condition = movement.condition
        const hasIssue = condition && condition !== 'OK'

        return (
          <div
            key={movement.id}
            className={cn(
              'flex items-start gap-4 p-4 rounded-lg border',
              hasIssue && 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30'
            )}
          >
            {/* Icon */}
            <div
              className={cn(
                'flex-shrink-0 p-2 rounded-full',
                isCheckout
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                  : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
              )}
            >
              {isCheckout ? (
                <ArrowUpFromLine className="h-4 w-4" />
              ) : (
                <ArrowDownToLine className="h-4 w-4" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium">
                  {isCheckout ? 'Sortie' : 'Retour'}
                </span>
                {!isCheckout && condition && (
                  <Badge variant={conditionConfig[condition].variant}>
                    {conditionConfig[condition].label}
                  </Badge>
                )}
              </div>

              <div className="text-sm text-muted-foreground mt-1">
                {user ? (
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                ) : (
                  <span>Utilisateur inconnu</span>
                )}
                <span className="mx-2">•</span>
                <span>
                  {format(new Date(movement.performedAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>

              {movement.notes && (
                <p className="mt-2 text-sm bg-muted/50 p-2 rounded">
                  {movement.notes}
                </p>
              )}

              {/* Photos for returns with damage */}
              {movement.photos && movement.photos.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {movement.photos.map((photo) => (
                    <a
                      key={photo.id}
                      href={photo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={photo.url}
                        alt="Photo du retour"
                        className="h-16 w-16 object-cover rounded border hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Status indicator */}
            <div className="flex-shrink-0">
              {hasIssue ? (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
