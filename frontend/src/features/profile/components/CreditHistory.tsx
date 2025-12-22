import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMyCreditTransactions } from "../hooks/useProfile";
import type { CreditTransaction } from "@/api/users.api";

const typeLabels: Record<string, string> = {
  MANUAL_ADD: "AJOUT MANUEL",
  MANUAL_REMOVE: "RETRAIT MANUEL",
  RESERVATION_CHARGE: "RÉSERVATION",
  RESERVATION_REFUND: "REMBOURSEMENT",
  CANCELLATION_REFUND: "ANNULATION",
  INITIAL_BALANCE: "SOLDE INITIAL",
  REFUND: "REMBOURSEMENT",
  RESERVATION: "RÉSERVATION",
  PENALTY: "PÉNALITÉ",
};

function TransactionItem({ transaction }: { transaction: CreditTransaction }) {
  const isPositive = transaction.amount > 0;

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="flex items-center gap-3">
        {isPositive ? (
          <ArrowUpCircle className="h-5 w-5 text-green-500" />
        ) : (
          <ArrowDownCircle className="h-5 w-5 text-red-500" />
        )}
        <div>
          <p className="font-medium text-sm">
            {typeLabels[transaction.type] || transaction.type}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(transaction.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {transaction.reason && (
            <p className="text-xs text-muted-foreground mt-1">
              {transaction.reason}
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        <Badge
          variant={isPositive ? "default" : "secondary"}
          className="font-mono"
        >
          {isPositive ? "+" : ""}
          {transaction.amount}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          Solde: {transaction.balanceAfter}
        </p>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

export function CreditHistory() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useMyCreditTransactions(
    page,
    ITEMS_PER_PAGE,
  );

  const transactions = data?.transactions || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historique des credits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive text-center py-4">
            Erreur lors du chargement de l'historique
          </p>
        )}

        {!isLoading && !error && transactions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune transaction de credits
          </p>
        )}

        {!isLoading && !error && transactions.length > 0 && (
          <>
            <div className="divide-y">
              {transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
