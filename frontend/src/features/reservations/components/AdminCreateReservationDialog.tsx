import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReservationDatePicker } from "./ReservationDatePicker";
import { useAdminCreateReservation } from "../hooks/useReservations";
import { useUsers } from "@/features/users/hooks/useUsers";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { Product } from "@/types";
import type { UserListItem } from "@/api/users.api";
import {
  Loader2,
  Search,
  User,
  Package,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

interface AdminCreateReservationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "user" | "product" | "dates";

const statusOptions = [
  {
    value: "CONFIRMED",
    label: "Confirmée",
    description: "Réservation à venir",
  },
  {
    value: "CHECKED_OUT",
    label: "En cours",
    description: "Produit déjà sorti",
  },
  { value: "RETURNED", label: "Terminée", description: "Produit déjà rendu" },
] as const;

export function AdminCreateReservationDialog({
  open,
  onOpenChange,
}: AdminCreateReservationDialogProps) {
  const [step, setStep] = useState<Step>("user");
  const [userSearch, setUserSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string | undefined>(undefined);
  const [endTime, setEndTime] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [status, setStatus] = useState<
    "CONFIRMED" | "CHECKED_OUT" | "RETURNED"
  >("CONFIRMED");
  const [isValid, setIsValid] = useState(false);

  const createReservation = useAdminCreateReservation();

  // Search users
  const { data: usersData, isLoading: usersLoading } = useUsers({
    search: userSearch,
    status: "ACTIVE",
  });

  // Search products
  const { data: productsData, isLoading: productsLoading } = useProducts(
    { search: productSearch, status: "AVAILABLE" },
    1,
    50,
  );

  const users = useMemo(() => {
    return usersData?.users || [];
  }, [usersData]);
  const products = useMemo(() => {
    return (productsData?.data || []) as Product[];
  }, [productsData]);

  // Filter users by search (case insensitive) - only those with validated caution
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return [];
    return users.filter(
      (u) =>
        (u.cautionStatus === "VALIDATED" || u.cautionStatus === "EXEMPTED") &&
        (u.firstName.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.lastName.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase())),
    );
  }, [users, userSearch]);

  // Filter products by search
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.reference &&
          p.reference.toLowerCase().includes(productSearch.toLowerCase())),
    );
  }, [products, productSearch]);

  const duration =
    startDate && endDate
      ? Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1
      : 0;

  const calculateTotalCost = () => {
    if (!duration || !selectedProduct?.priceCredits) return 0;
    if (selectedProduct.creditPeriod === "WEEK") {
      const weeks = Math.ceil(duration / 7);
      return weeks * selectedProduct.priceCredits;
    }
    return duration * selectedProduct.priceCredits;
  };
  const totalCost = calculateTotalCost();

  const canSubmit =
    selectedUser &&
    selectedProduct &&
    startDate &&
    endDate &&
    isValid &&
    selectedUser.creditBalance >= totalCost;

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !selectedProduct || !startDate || !endDate) {
      return;
    }

    try {
      await createReservation.mutateAsync({
        userId: selectedUser.id,
        productId: selectedProduct.id,
        startDate: formatDateLocal(startDate),
        endDate: formatDateLocal(endDate),
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        notes: notes.trim() || undefined,
        adminNotes: adminNotes.trim() || undefined,
        status,
      });

      resetForm();
      onOpenChange(false);
    } catch {
      // Error handled by mutation onError
    }
  };

  const resetForm = () => {
    setStep("user");
    setUserSearch("");
    setProductSearch("");
    setSelectedUser(null);
    setSelectedProduct(null);
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime(undefined);
    setEndTime(undefined);
    setNotes("");
    setAdminNotes("");
    setStatus("CONFIRMED");
    setIsValid(false);
  };

  const handleClose = () => {
    if (!createReservation.isPending) {
      resetForm();
      onOpenChange(false);
    }
  };

  const goBack = () => {
    if (step === "product") {
      setSelectedProduct(null);
      setProductSearch("");
      setStep("user");
    } else if (step === "dates") {
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime(undefined);
      setEndTime(undefined);
      setStep("product");
    }
  };

  const renderUserStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="user-search">Rechercher un utilisateur</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="user-search"
            placeholder="Nom, prénom ou email..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {usersLoading && userSearch.trim() && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!usersLoading && userSearch.trim() && filteredUsers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun utilisateur actif avec caution validée trouvé</p>
        </div>
      )}

      {!usersLoading && filteredUsers.length > 0 && (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              type="button"
              className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
              onClick={() => {
                setSelectedUser(user);
                setStep("product");
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="outline">{user.creditBalance} crédits</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderProductStep = () => (
    <div className="space-y-4">
      {/* Selected user summary */}
      {selectedUser && (
        <div className="p-3 bg-muted/30 rounded-lg border">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {selectedUser.firstName} {selectedUser.lastName}
            </span>
            <Badge variant="outline" className="ml-auto">
              {selectedUser.creditBalance} crédits
            </Badge>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="product-search">Rechercher un produit</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="product-search"
            placeholder="Nom ou référence..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      {productsLoading && productSearch.trim() && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!productsLoading &&
        productSearch.trim() &&
        filteredProducts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Aucun produit disponible trouvé</p>
          </div>
        )}

      {!productsLoading && filteredProducts.length > 0 && (
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className="w-full p-3 text-left rounded-lg border hover:bg-muted/50 transition-colors"
              onClick={() => {
                setSelectedProduct(product);
                setStep("dates");
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.name}</p>
                  {product.reference && (
                    <p className="text-sm text-muted-foreground">
                      Réf: {product.reference}
                    </p>
                  )}
                </div>
                {product.priceCredits !== null && (
                  <Badge variant="secondary">
                    {product.priceCredits} cr/
                    {product.creditPeriod === "WEEK" ? "sem" : "j"}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderDatesStep = () => (
    <div className="space-y-4">
      {/* Selected user & product summary */}
      <div className="space-y-2">
        {selectedUser && (
          <div className="p-2 bg-muted/30 rounded-lg border text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>
                {selectedUser.firstName} {selectedUser.lastName}
              </span>
              <Badge variant="outline" className="ml-auto text-xs">
                {selectedUser.creditBalance} cr
              </Badge>
            </div>
          </div>
        )}
        {selectedProduct && (
          <div className="p-2 bg-muted/30 rounded-lg border text-sm">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{selectedProduct.name}</span>
              {selectedProduct.priceCredits !== null && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {selectedProduct.priceCredits} cr/
                  {selectedProduct.creditPeriod === "WEEK" ? "sem" : "j"}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Date Picker */}
      {selectedProduct && (
        <ReservationDatePicker
          product={selectedProduct}
          startDate={startDate}
          endDate={endDate}
          startTime={startTime}
          endTime={endTime}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onStartTimeChange={setStartTime}
          onEndTimeChange={setEndTime}
          onValidationChange={setIsValid}
          isAdmin
        />
      )}

      {/* Status Selection */}
      <div className="space-y-2">
        <Label>Statut initial</Label>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as typeof status)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex flex-col">
                  <span>{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes utilisateur (optionnel)</Label>
        <Textarea
          id="notes"
          placeholder="Notes visibles par l'utilisateur..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          className="text-sm resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-notes">Notes admin (optionnel)</Label>
        <Textarea
          id="admin-notes"
          placeholder="Notes internes..."
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          rows={2}
          maxLength={1000}
          className="text-sm resize-none"
        />
      </div>

      {/* Summary */}
      {isValid && startDate && endDate && selectedUser && (
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-primary/5 rounded-md border border-primary/10">
            <div className="flex items-center gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                {duration} jour{duration > 1 ? "s" : ""}
              </span>
            </div>
            <span className="font-semibold text-sm">{totalCost} crédits</span>
          </div>

          {selectedUser.creditBalance < totalCost && (
            <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>
                Crédits insuffisants ({selectedUser.creditBalance} disponibles)
              </span>
            </div>
          )}

          {selectedUser.creditBalance >= totalCost && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md border border-green-200 dark:border-green-800">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>
                Solde après réservation:{" "}
                {selectedUser.creditBalance - totalCost} crédits
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "user" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={goBack}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>
              {step === "user" && "Créer une réservation - Utilisateur"}
              {step === "product" && "Créer une réservation - Produit"}
              {step === "dates" && "Créer une réservation - Détails"}
            </DialogTitle>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                step === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/20 text-primary"
              }`}
            >
              1
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                step === "product"
                  ? "bg-primary text-primary-foreground"
                  : step === "dates"
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <div className="flex-1 h-0.5 bg-muted" />
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                step === "dates"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="py-4">
            {step === "user" && renderUserStep()}
            {step === "product" && renderProductStep()}
            {step === "dates" && renderDatesStep()}
          </div>

          {/* Footer actions for dates step */}
          {step === "dates" && (
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createReservation.isPending}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || createReservation.isPending}
                className="flex-1"
              >
                {createReservation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Créer la réservation
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
