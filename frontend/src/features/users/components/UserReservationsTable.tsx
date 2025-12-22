import { useNavigate } from 'react-router-dom'
import { Calendar, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatDate,
  getReservationStatusLabel,
  getReservationStatusColor,
} from '../utils/userHelpers'
import type { UserReservation } from '@/api/users.api'

interface UserReservationsTableProps {
  reservations: UserReservation[] | undefined
  isLoading: boolean
  title?: string
  // Pagination
  page: number
  limit: number
  total?: number
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50]

export function UserReservationsTable({
  reservations,
  isLoading,
  title = 'Réservations',
  page,
  limit,
  total = 0,
  onPageChange,
  onLimitChange,
}: UserReservationsTableProps) {
  const navigate = useNavigate()

  const totalPages = Math.ceil(total / limit)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {title}
          {total > 0 && <span className="text-muted-foreground">({total})</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : !reservations || reservations.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">Aucune réservation</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Crédits</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell className="font-medium">
                      {reservation.product.name}
                      {reservation.product.reference && (
                        <span className="text-muted-foreground text-sm ml-2">
                          ({reservation.product.reference})
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(reservation.startDate)} - {formatDate(reservation.endDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getReservationStatusColor(reservation.status)}>
                        {getReservationStatusLabel(reservation.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{reservation.creditsCharged}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/reservations/${reservation.id}`)}
                        title="Voir la réservation"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Afficher</span>
                  <Select
                    value={String(limit)}
                    onValueChange={(v) => onLimitChange(Number(v))}
                  >
                    <SelectTrigger className="w-16 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>par page</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {page} sur {totalPages || 1}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPageChange(page - 1)}
                      disabled={!hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onPageChange(page + 1)}
                      disabled={!hasNextPage}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
