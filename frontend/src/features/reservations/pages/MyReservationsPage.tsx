import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyReservations, useCancelMyReservation } from '../hooks/useReservations'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, AlertCircle, Eye, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, SlidersHorizontal } from 'lucide-react'
import { ReservationCardSkeleton } from '../components/ReservationCardSkeleton'
import { CancelReservationDialog } from '../components/CancelReservationDialog'
import type { ReservationStatus, Reservation } from '@/types'

const statusLabels: Record<ReservationStatus, string> = {
  CONFIRMED: 'Confirmée',
  CHECKED_OUT: 'En cours',
  RETURNED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
}

const statusColors: Record<ReservationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  CONFIRMED: 'default',
  CHECKED_OUT: 'default',
  RETURNED: 'outline',
  CANCELLED: 'destructive',
  REFUNDED: 'outline',
}

export function MyReservationsPage() {
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'startDate' | 'createdAt' | 'endDate'>('startDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reservationToCancel, setReservationToCancel] = useState<{ id: string; productName?: string } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const filters = {
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    sortBy,
    sortOrder,
  }
  const { data, isLoading, isError } = useMyReservations(filters, page, limit)
  const cancelReservation = useCancelMyReservation()

  const openCancelDialog = (id: string, productName?: string) => {
    setReservationToCancel({ id, productName })
    setCancelDialogOpen(true)
  }

  const handleConfirmCancel = async () => {
    if (!reservationToCancel) return
    await cancelReservation.mutateAsync({ id: reservationToCancel.id })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const resetFilters = () => {
    setStatusFilter('all')
    setSortBy('startDate')
    setSortOrder('desc')
    setPage(1)
  }

  const hasActiveFilters = statusFilter !== 'all' || sortBy !== 'startDate' || sortOrder !== 'desc'

  const totalPages = data?.pagination?.totalPages || 1
  const currentPage = data?.pagination?.page || page
  const totalItems = data?.pagination?.total || 0

  const goToPage = (newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, totalPages)))
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mes réservations</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez vos réservations de matériel</p>
        </div>
        {data && data.pagination && (
          <div className="text-sm text-muted-foreground">
            {totalItems} réservation{totalItems > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 sm:max-w-xs">
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
                  <SelectItem value="CONFIRMED">Confirmée</SelectItem>
                  <SelectItem value="CHECKED_OUT">En cours</SelectItem>
                  <SelectItem value="RETURNED">Terminée</SelectItem>
                  <SelectItem value="CANCELLED">Annulée</SelectItem>
                  <SelectItem value="REFUNDED">Remboursée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:w-auto"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Plus de filtres
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={resetFilters} className="sm:w-auto">
                Réinitialiser
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Trier par</Label>
                <Select
                  value={sortBy}
                  onValueChange={(value) => {
                    setSortBy(value as typeof sortBy)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startDate">Date de sortie</SelectItem>
                    <SelectItem value="endDate">Date de retour</SelectItem>
                    <SelectItem value="createdAt">Date de création</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ordre</Label>
                <Select
                  value={sortOrder}
                  onValueChange={(value) => {
                    setSortOrder(value as typeof sortOrder)
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Plus récent d'abord</SelectItem>
                    <SelectItem value="asc">Plus ancien d'abord</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Résultats par page</Label>
                <Select
                  value={limit.toString()}
                  onValueChange={(value) => {
                    setLimit(Number(value))
                    setPage(1)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReservationCardSkeleton key={i} />
          ))}
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
                    {hasActiveFilters
                      ? 'Aucune réservation ne correspond à vos filtres'
                      : "Vous n'avez pas encore de réservation"}
                  </p>
                </div>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={resetFilters}>
                    Réinitialiser les filtres
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/products">Parcourir les produits</Link>
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.data.map((reservation: Reservation) => (
                <Card key={reservation.id} className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
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

                      <div className="flex gap-6 text-sm">
                        <div>
                          <span className="text-muted-foreground">Durée: </span>
                          <span className="font-medium">
                            {calculateDuration(reservation.startDate, reservation.endDate)} jours
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coût: </span>
                          <span className="font-medium">{reservation.creditsCharged} crédits</span>
                        </div>
                      </div>

                      {reservation.notes && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Notes:</p>
                          <p className="italic">{reservation.notes}</p>
                        </div>
                      )}

                      {reservation.status === 'CANCELLED' && reservation.cancelReason && (
                        <div className="text-sm">
                          <p className="text-muted-foreground">Motif d'annulation:</p>
                          <p>{reservation.cancelReason}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
                      <Button asChild variant="outline" className="flex-1 lg:flex-none">
                        <Link to={`/my-reservations/${reservation.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Détails
                        </Link>
                      </Button>

                      {reservation.status === 'CONFIRMED' && (
                        <Button
                          variant="destructive"
                          className="flex-1 lg:flex-none"
                          onClick={() => openCancelDialog(reservation.id, reservation.product?.name)}
                        >
                          <X className="mr-2 h-4 w-4" />
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
          {data.pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} ({totalItems} résultat{totalItems > 1 ? 's' : ''})
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => goToPage(pageNum)}
                          className="w-9 h-9"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <CancelReservationDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleConfirmCancel}
        productName={reservationToCancel?.productName}
        isLoading={cancelReservation.isPending}
      />
    </div>
  )
}
