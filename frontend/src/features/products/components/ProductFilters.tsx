import { Label } from '@/components/ui/label'
import type { ProductFilters as Filters, ProductStatus } from '@/types'
import { useSections } from '../hooks/useSections'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface ProductFiltersProps {
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  const { data: sections } = useSections()

  // Get subsections from the selected section
  const selectedSection = sections?.find((s) => s.id === filters.sectionId)
  const subSections = selectedSection?.subSections || []

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters =
    filters.sectionId ||
    filters.subSectionId ||
    filters.status ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filtres</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 px-2 text-xs"
          >
            <X className="mr-1 h-3 w-3" />
            Effacer
          </Button>
        )}
      </div>

      {/* Section Filter */}
      <div className="space-y-2">
        <Label htmlFor="section">Section</Label>
        <select
          id="section"
          value={filters.sectionId || ''}
          onChange={(e) => {
            onFiltersChange({
              ...filters,
              sectionId: e.target.value || undefined,
              subSectionId: undefined, // Reset subsection when section changes
            })
          }}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Toutes les sections</option>
          {sections?.map((section) => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </div>

      {/* SubSection Filter */}
      {filters.sectionId && subSections && subSections.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="subsection">Sous-section</Label>
          <select
            id="subsection"
            value={filters.subSectionId || ''}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                subSectionId: e.target.value || undefined,
              })
            }
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Toutes les sous-sections</option>
            {subSections.map((subSection) => (
              <option key={subSection.id} value={subSection.id}>
                {subSection.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="status">Disponibilité</Label>
        <select
          id="status"
          value={filters.status || ''}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              status: (e.target.value as ProductStatus) || undefined,
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Tous les statuts</option>
          <option value="AVAILABLE">Disponible</option>
          <option value="UNAVAILABLE">Indisponible</option>
          <option value="MAINTENANCE">En maintenance</option>
        </select>
      </div>

      {/* Sort Options */}
      <div className="space-y-2">
        <Label htmlFor="sortBy">Trier par</Label>
        <select
          id="sortBy"
          value={filters.sortBy || 'createdAt'}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              sortBy: e.target.value as Filters['sortBy'],
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="createdAt">Date de création</option>
          <option value="name">Nom</option>
          <option value="priceCredits">Prix</option>
        </select>
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label htmlFor="sortOrder">Ordre</Label>
        <select
          id="sortOrder"
          value={filters.sortOrder || 'desc'}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              sortOrder: e.target.value as 'asc' | 'desc',
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="desc">Décroissant</option>
          <option value="asc">Croissant</option>
        </select>
      </div>
    </div>
  )
}
