import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Archive, MoreHorizontal, Package } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductStatusBadge } from "./ProductStatusBadge";
import { ROUTES } from "@/constants/routes";
import type { Product } from "@/types";

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  onArchive?: (product: Product) => void;
}

export function ProductTable({
  products,
  isLoading,
  onArchive,
}: ProductTableProps) {
  const navigate = useNavigate();
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (productId: string) => {
    setImageErrors((prev) => new Set(prev).add(productId));
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]"></TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Référence</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-10 w-10 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-8" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucun produit</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Aucun produit ne correspond à vos critères de recherche.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]"></TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Référence</TableHead>
            <TableHead>Section</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Prix</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              className="cursor-pointer"
              onClick={() =>
                navigate(ROUTES.ADMIN_PRODUCT_DETAIL.replace(":id", product.id))
              }
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                {product.thumbnail?.url && !imageErrors.has(product.id) ? (
                  <img
                    src={product.thumbnail.url}
                    alt={product.name}
                    className="h-10 w-10 rounded object-cover"
                    onError={() => handleImageError(product.id)}
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {product.reference || "-"}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span>{product.section.name}</span>
                  {product.subSection ? (
                    <span className="text-xs text-muted-foreground">
                      {product.subSection.name}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Sans catégorie
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <ProductStatusBadge status={product.status} />
              </TableCell>
              <TableCell className="text-right">
                {product.priceCredits !== null ? (
                  <span>
                    {product.priceCredits}/
                    {product.creditPeriod === "WEEK" ? "sem." : "j"}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(
                          ROUTES.ADMIN_PRODUCT_DETAIL.replace(
                            ":id",
                            product.id,
                          ),
                        )
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(
                          `${ROUTES.ADMIN_PRODUCT_DETAIL.replace(":id", product.id)}?edit=true`,
                        )
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    {product.status !== "ARCHIVED" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onArchive?.(product)}
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Archiver
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
