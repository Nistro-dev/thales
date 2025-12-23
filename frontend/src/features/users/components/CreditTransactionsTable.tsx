import {
  Coins,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatDateTime,
  getCreditTransactionTypeLabel,
  getCreditTransactionTypeColor,
} from "../utils/userHelpers";
import type { CreditTransaction } from "@/api/users.api";

interface CreditTransactionsTableProps {
  transactions: CreditTransaction[] | undefined;
  isLoading: boolean;
  title?: string;
  // Pagination
  page: number;
  limit: number;
  total?: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function CreditTransactionsTable({
  transactions,
  isLoading,
  title = "Historique des crédits",
  page,
  limit,
  total = 0,
  onPageChange,
  onLimitChange,
}: CreditTransactionsTableProps) {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {title}
          {total > 0 && (
            <span className="text-muted-foreground">({total})</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucune transaction
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Montant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead>Raison</TableHead>
                  <TableHead>Solde après</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.amount > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span
                          className={`font-medium ${
                            transaction.amount > 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.amount > 0 ? "+" : ""}
                          {transaction.amount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getCreditTransactionTypeColor(
                          transaction.type,
                        )}
                      >
                        {getCreditTransactionTypeLabel(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.performedByUser
                        ? `${transaction.performedByUser.firstName} ${transaction.performedByUser.lastName}`
                        : "Automatique"}
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {transaction.reason || "-"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {transaction.balanceAfter}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(transaction.createdAt)}
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
  );
}
