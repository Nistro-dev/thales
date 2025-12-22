import { Calendar, Package, Users, Coins } from 'lucide-react'
import { StatCard } from './StatCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { RealtimeStats } from '@/api/stats.api'

interface StatsGridProps {
  stats?: RealtimeStats
  isLoading?: boolean
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Réservations actives"
        value={stats?.activeReservations ?? 0}
        icon={Calendar}
        iconColor="text-blue-500"
      />
      <StatCard
        title="Produits disponibles"
        value={stats?.availableProducts ?? 0}
        icon={Package}
        iconColor="text-green-500"
      />
      <StatCard
        title="Utilisateurs actifs"
        value={stats?.totalUsers ?? 0}
        icon={Users}
        iconColor="text-purple-500"
      />
      <StatCard
        title="Crédits en circulation"
        value={stats?.totalCreditsInCirculation ?? 0}
        icon={Coins}
        iconColor="text-yellow-500"
      />
    </div>
  )
}
