import { LayoutDashboard } from 'lucide-react'
import { StatsGrid, AlertCard } from '../components'
import { useRealtimeStats, useAlerts } from '../hooks/useStats'

export function AdminDashboardPage() {
  const { data: realtimeStats, isLoading: isLoadingStats } = useRealtimeStats()
  const { data: alerts, isLoading: isLoadingAlerts } = useAlerts()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboard className="h-8 w-8" />
          Dashboard
        </h1>
        <p className="text-muted-foreground">Vue d'ensemble en temps réel</p>
      </div>

      <StatsGrid stats={realtimeStats} isLoading={isLoadingStats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AlertCard alerts={alerts} isLoading={isLoadingAlerts} />
      </div>
    </div>
  )
}
