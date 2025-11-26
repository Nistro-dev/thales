import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyReservations, useCancelMyReservation } from '../hooks/useReservations'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Package, AlertCircle, Loader2, Eye, X } from 'lucide-react'
import type { ReservationStatus } from '@/types'

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CHECKED_OUT: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

const statusColors: Record<ReservationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  CHECKED_OUT: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
  REFUNDED: 'outline',
}

export function MyReservationsPage() {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const filters = statusFilter !== 'all' ? { status: statusFilter } : {}
  const { data, isLoading, isError } = useMyReservations(filters, page, limit)
  const cancelReservation = useCancelMyReservation()

  const handleCancelReservation = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return
    }

    try {
      await cancelReservation.mutateAsync({ id })
    } catch (error) {
      // Error handled by hook
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mes réservations</h1>
        <p className="text-muted-foreground">Gérez vos réservations de matériel</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ReservationStatus | 'all')
                setPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                <SelectItem value="CHECKED_OUT">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminée</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
                <SelectItem value="REFUNDED">Remboursée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Card className="border-destructive bg-destructive/10 p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="text-lg font-semibold text-destructive">Erreur de chargement</p>
              <p className="text-sm text-muted-foreground">
                Impossible de charger vos réservations
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Reservations List */}
      {!isLoading && !isError && data && (
        <>
          {data.data.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <Calendar className="h-16 w-16 text-muted-foreground" />
                <div>
                  <p className="text-lg font-semibold">Aucune réservation</p>
                  <p className="text-sm text-muted-foreground">
                    Vous n'avez pas encore de réservation
                  </p>
                </div>
                <Button asChild>
                  <Link to="/products">Parcourir les produits</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.data.map((reservation) => (
                <Card key={reservation.id} className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Product Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {reservation.product?.name || 'Produit'}
                          </h3>
                          {reservation.product?.reference && (
                            <p className="text-sm text-muted-foreground">
                              Réf: {reservation.product.reference}
                            </p>
                          )}
                        </div>
                        <Badge variant={statusColors[reservation.status]}>
                          {statusLabels[reservation.status]}
                        </Badge>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date de sortie</p>
                          <p className="font-medium">{formatDate(reservation.startDate)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Date de retour</p>
                          <p className="font-medium">{formatDate(reservation.endDate)}</p>
                        </div>
                      </div>

                      {/* Duration & Cost */}
                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Durée: </span>
                          <span className="font-medium">
                            {calculateDuration(reservation.startDate, reservation.endDate)} jours
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coût: </span>
                          <span className="font-medium">{reservation.priceCredits} crédits</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {reservation.notes && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Notes:</p>
                          <p className="italic">{reservation.notes}</p>
                        </div>
                      )}

                      {/* Cancellation Info */}
                      {reservation.status === 'CANCELLED' && reservation.cancelledReason && (
                        <div className="rounded-lg bg-destructive/10 p-3 text-sm">
                          <p className="font-medium text-destructive">Motif d'annulation:</p>
                          <p className="text-muted-foreground">{reservation.cancelledReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                      <Button asChild variant="outline" className="flex-1 lg:flex-none">
                        <Link to={`/reservations/${reservation.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Détails
                        </Link>
                      </Button>

                      {(reservation.status === 'PENDING' || reservation.status === 'CONFIRMED') && (
                        <Button
                          variant="destructive"
                          className="flex-1 lg:flex-none"
                          onClick={() => handleCancelReservation(reservation.id)}
                          disabled={cancelReservation.isPending}
                        >
                          {cancelReservation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <X className="mr-2 h-4 w-4" />
                          )}
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <div className="flex items-center gap-2 px-4">
                <span className="text-sm text-muted-foreground">
                  Page {data.pagination.page} sur {data.pagination.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
