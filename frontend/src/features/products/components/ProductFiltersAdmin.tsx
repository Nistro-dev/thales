import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSections } from "@/features/products/hooks/useSections";
import type { ProductFilters, ProductStatus } from "@/types";

interface ProductFiltersAdminProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

const STATUS_OPTIONS: { value: ProductStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous (y compris archivés)" },
  { value: "AVAILABLE", label: "Disponible" },
  { value: "UNAVAILABLE", label: "Indisponible" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ARCHIVED", label: "Archivé" },
];

export function ProductFiltersAdmin({
  filters,
  onFiltersChange,
}: ProductFiltersAdminProps) {
  const { data: sections } = useSections();

  const selectedSection = sections?.find((s) => s.id === filters.sectionId);
  const subSections = selectedSection?.subSections || [];

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleSectionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sectionId: value === "ALL" ? undefined : value,
      subSectionId: undefined, // Reset subsection when section changes
    });
  };

  const handleSubSectionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      subSectionId: value === "ALL" ? undefined : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "ALL" ? undefined : (value as ProductStatus),
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasFilters =
    filters.search ||
    filters.sectionId ||
    filters.subSectionId ||
    filters.status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Section */}
      <Select
        value={filters.sectionId || "ALL"}
        onValueChange={handleSectionChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Section" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Toutes les sections</SelectItem>
          {sections?.map((section) => (
            <SelectItem key={section.id} value={section.id}>
              {section.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* SubSection (only if section selected) */}
      {filters.sectionId && subSections.length > 0 && (
        <Select
          value={filters.subSectionId || "ALL"}
          onValueChange={handleSubSectionChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sous-section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Toutes</SelectItem>
            {subSections.map((sub) => (
              <SelectItem key={sub.id} value={sub.id}>
                {sub.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status */}
      <Select
        value={filters.status || "ALL"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Effacer
        </Button>
      )}
    </div>
  );
}
