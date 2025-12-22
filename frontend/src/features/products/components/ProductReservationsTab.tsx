import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductReservations } from "../hooks/useProductsAdmin";
import { ROUTES } from "@/constants/routes";
import type { ProductCondition } from "@/types";

interface ProductReservationsTabProps {
  productId: string;
}

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  PENDING: { label: "En attente", variant: "outline" },
  CONFIRMED: { label: "Confirmée", variant: "default" },
  CHECKED_OUT: { label: "En cours", variant: "secondary" },
  RETURNED: { label: "Retournée", variant: "default" },
  CANCELLED: { label: "Annulée", variant: "destructive" },
  EXPIRED: { label: "Expirée", variant: "destructive" },
};

const conditionLabels: Record<
  ProductCondition,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  OK: { label: "OK", variant: "default" },
  MINOR_DAMAGE: { label: "Dégâts mineurs", variant: "secondary" },
  MAJOR_DAMAGE: { label: "Dégâts majeurs", variant: "destructive" },
  MISSING_PARTS: { label: "Pièces manquantes", variant: "destructive" },
  BROKEN: { label: "Cassé", variant: "destructive" },
};

export function ProductReservationsTab({
  productId,
}: ProductReservationsTabProps) {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const limit = 10;

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  };

  const { data, isLoading } = useProductReservations(productId, {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: status !== "all" ? status : undefined,
    sortBy: "startDate",
    sortOrder: "desc",
  });

  const reservations = data?.data || [];
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const handleRowClick = (reservationId: string) => {
    navigate(ROUTES.ADMIN_RESERVATION_DETAIL.replace(":id", reservationId));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, dates..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="CONFIRMED">Confirmée</SelectItem>
            <SelectItem value="CHECKED_OUT">En cours</SelectItem>
            <SelectItem value="RETURNED">Retournée</SelectItem>
            <SelectItem value="CANCELLED">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {debouncedSearch || status !== "all"
              ? "Aucune réservation trouvée avec ces critères"
              : "Aucune réservation pour ce produit"}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Utilisateur
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Dates
                    </div>
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>État retour</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => {
                  const statusInfo = statusLabels[reservation.status] || {
                    label: reservation.status,
                    variant: "outline" as const,
                  };
                  const conditionInfo = reservation.returnCondition
                    ? conditionLabels[
                        reservation.returnCondition as ProductCondition
                      ]
                    : null;

                  return (
                    <TableRow
                      key={reservation.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(reservation.id)}
                    >
                      <TableCell className="font-medium">
                        {reservation.user.firstName} {reservation.user.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span>
                            {format(
                              new Date(reservation.startDate),
                              "dd MMM yyyy",
                              { locale: fr },
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            →{" "}
                            {format(
                              new Date(reservation.endDate),
                              "dd MMM yyyy",
                              { locale: fr },
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {conditionInfo ? (
                          <Badge variant={conditionInfo.variant}>
                            {conditionInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {pagination.total} réservation{pagination.total > 1 ? "s" : ""}{" "}
                au total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  disabled={page === pagination.totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
