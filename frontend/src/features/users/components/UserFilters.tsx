import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserStatus, CautionStatus } from '@/api/users.api'

interface UserFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  status: UserStatus | 'ALL'
  onStatusChange: (value: UserStatus | 'ALL') => void
  cautionStatus: CautionStatus | ''
  onCautionStatusChange: (value: CautionStatus | '') => void
  onClearFilters: () => void
}

export function UserFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  cautionStatus,
  onCautionStatusChange,
  onClearFilters,
}: UserFiltersProps) {
  const hasFilters = search || status !== 'ACTIVE' || cautionStatus

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={status}
        onValueChange={(v) => onStatusChange(v as UserStatus | 'ALL')}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Tous les statuts</SelectItem>
          <SelectItem value="ACTIVE">Actif</SelectItem>
          <SelectItem value="SUSPENDED">Suspendu</SelectItem>
          <SelectItem value="DISABLED">Désactivé</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={cautionStatus || 'all'}
        onValueChange={(v) => onCautionStatusChange(v === 'all' ? '' : (v as CautionStatus))}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Caution" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes cautions</SelectItem>
          <SelectItem value="PENDING">En attente</SelectItem>
          <SelectItem value="VALIDATED">Validée</SelectItem>
          <SelectItem value="EXEMPTED">Exempté</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClearFilters} title="Effacer les filtres">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
