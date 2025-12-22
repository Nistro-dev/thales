import { useState, useMemo } from 'react'
import { useProducts } from '../hooks/useProducts'
import { ProductCard } from '../components/ProductCard'
import { ProductFilters } from '../components/ProductFilters'
import { ProductFiltersSkeleton } from '../components/ProductFiltersSkeleton'
import { ProductCardSkeleton } from '../components/ProductCardSkeleton'
import { ProductSearch } from '../components/ProductSearch'
import type { ProductFilters as Filters } from '@/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'

export function ProductsPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({})
  const [search, setSearch] = useState('')

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 500)

  // Combine filters with debounced search
  const finalFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch || undefined,
    }),
    [filters, debouncedSearch]
  )

  const { data, isLoading, isError } = useProducts(finalFilters, page, 20)

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(1) // Reset to page 1 when filters change
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to page 1 when search changes
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Produits</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Parcourez notre catalogue de produits disponibles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Filters Sidebar - Hidden on mobile */}
        <aside className="hidden lg:block space-y-4">
          {isLoading ? <ProductFiltersSkeleton /> : <ProductFilters filters={filters} onFiltersChange={handleFiltersChange} />}
        </aside>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Search Bar */}
          <ProductSearch value={search} onChange={handleSearchChange} />

          {/* Mobile Filters */}
          <div className="lg:hidden">
            {!isLoading && <ProductFilters filters={filters} onFiltersChange={handleFiltersChange} />}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
              <p className="text-destructive">Une erreur est survenue lors du chargement des produits.</p>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !isError && data && (
            <>
              {data.data.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <p className="text-muted-foreground">Aucun produit trouvé</p>
                  {(filters.sectionId || filters.status || debouncedSearch) && (
                    <Button
                      variant="link"
                      onClick={() => {
                        setFilters({})
                        setSearch('')
                      }}
                      className="mt-2"
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {data.data.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {data.pagination && data.pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
                      <div className="text-sm text-muted-foreground">
                        Page {data.pagination.page} sur {data.pagination.totalPages}
                        {' · '}
                        {data.pagination.total} produit{data.pagination.total > 1 ? 's' : ''}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline ml-1">Précédent</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage((p) => p + 1)}
                          disabled={page === data.pagination.totalPages}
                        >
                          <span className="hidden sm:inline mr-1">Suivant</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
