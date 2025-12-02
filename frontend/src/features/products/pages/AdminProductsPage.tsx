import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Plus, ChevronLeft, ChevronRight, Archive } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProductTable } from '../components/ProductTable'
import { ProductFiltersAdmin } from '../components/ProductFiltersAdmin'
import { useProductsAdmin, useDeleteProduct } from '../hooks/useProductsAdmin'
import { ROUTES } from '@/constants/routes'
import type { Product, ProductFilters } from '@/types'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function AdminProductsPage() {
  const navigate = useNavigate()

  // Filters state
  const [filters, setFilters] = useState<ProductFilters>({})
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Build query params
  const queryFilters = useMemo(
    () => ({
      ...filters,
      includeArchived: true, // Admin can see archived products
    }),
    [filters]
  )

  // Fetch products
  const { data, isLoading } = useProductsAdmin(queryFilters, page, limit)

  // Archive dialog
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const deleteProduct = useDeleteProduct()

  const handleFiltersChange = (newFilters: ProductFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleArchive = (product: Product) => {
    setSelectedProduct(product)
    setArchiveDialogOpen(true)
  }

  const confirmArchive = async () => {
    if (!selectedProduct) return
    try {
      await deleteProduct.mutateAsync(selectedProduct.id)
      setArchiveDialogOpen(false)
      setSelectedProduct(null)
    } catch {
      // Error handled in hook
    }
  }

  // Pagination calculations
  const total = data?.pagination?.total ?? 0
  const totalPages = data?.pagination?.totalPages ?? 1
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 sm:h-8 sm:w-8" />
            Produits
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérer le catalogue de produits</p>
        </div>

        <Button onClick={() => navigate(ROUTES.ADMIN_PRODUCT_NEW)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau produit
        </Button>
      </div>

      {/* Filters */}
      <ProductFiltersAdmin filters={filters} onFiltersChange={handleFiltersChange} />

      {/* Products Table */}
      <ProductTable
        products={data?.data || []}
        isLoading={isLoading}
        onArchive={handleArchive}
      />

      {/* Pagination */}
      {data?.data && data.data.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Afficher</span>
            <Select value={String(limit)} onValueChange={(v) => handleLimitChange(Number(v))}>
              <SelectTrigger className="w-20 h-8">
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
            <span className="hidden sm:inline ml-4">
              {total} produit{total > 1 ? 's' : ''} au total
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {page} sur {totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page - 1)}
                disabled={!hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(page + 1)}
                disabled={!hasNextPage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Archiver le produit</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Êtes-vous sûr de vouloir archiver{' '}
                  <strong className="text-foreground">{selectedProduct?.name}</strong> ?
                </p>
                <p>
                  Le produit ne sera plus visible dans le catalogue et ne pourra plus être réservé.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteProduct.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmArchive}
              disabled={deleteProduct.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteProduct.isPending ? 'Archivage...' : 'Archiver'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
