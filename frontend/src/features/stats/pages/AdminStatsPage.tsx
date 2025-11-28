import { useState } from 'react'
import { BarChart3, Calendar, RefreshCw, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ReservationsChart,
  CreditsChart,
  SectionsChart,
  TopProductsTable,
  TopUsersTable,
  SectionsStatsTable,
} from '../components'
import {
  useDashboardStats,
  useTopProducts,
  useTopUsers,
  useSectionsStats,
} from '../hooks/useStats'
import { statsApi } from '@/api/stats.api'
import { getDateRange, formatNumber } from '../utils/statsHelpers'

type PeriodPreset = 'week' | 'month' | 'quarter' | 'year' | 'custom'

export function AdminStatsPage() {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  // Calculate dates based on preset or custom
  const { from, to } =
    periodPreset === 'custom' && customFrom && customTo
      ? { from: customFrom, to: customTo }
      : getDateRange(periodPreset === 'custom' ? 'month' : periodPreset)

  const { data: dashboardStats, isLoading: isLoadingDashboard, refetch } = useDashboardStats(from, to)
  const { data: topProducts, isLoading: isLoadingProducts } = useTopProducts(from, to)
  const { data: topUsers, isLoading: isLoadingUsers } = useTopUsers(from, to)
  const { data: sectionsStats, isLoading: isLoadingSections } = useSectionsStats(from, to)

  const handlePeriodChange = (value: string) => {
    setPeriodPreset(value as PeriodPreset)
    if (value !== 'custom') {
      setCustomFrom('')
      setCustomTo('')
    }
  }

  const handleApplyCustom = () => {
    if (customFrom && customTo) {
      refetch()
    }
  }

  const isLoading = isLoadingDashboard || isLoadingProducts || isLoadingUsers || isLoadingSections
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (type: 'reservations' | 'products' | 'users' | 'movements') => {
    setIsExporting(true)
    try {
      await statsApi.exportStats(from, to, type)
      toast.success('Export téléchargé avec succès')
    } catch {
      toast.error("Erreur lors de l'export")
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportXlsx = async () => {
    setIsExporting(true)
    try {
      await statsApi.exportXlsx(from, to)
      toast.success('Export Excel téléchargé avec succès')
    } catch {
      toast.error("Erreur lors de l'export Excel")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Statistiques
          </h1>
          <p className="text-muted-foreground">Analyse détaillée par période</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Period Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-48">
              <Label>Période prédéfinie</Label>
              <Select value={periodPreset} onValueChange={handlePeriodChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">3 derniers mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {periodPreset === 'custom' && (
              <>
                <div className="w-full sm:w-40">
                  <Label>Du</Label>
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-40">
                  <Label>Au</Label>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
                <Button onClick={handleApplyCustom} disabled={!customFrom || !customTo}>
                  Appliquer
                </Button>
              </>
            )}

            <div className="flex-1" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Export...' : 'Exporter'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportXlsx} className="font-medium">
                  Tout exporter (Excel)
                </DropdownMenuItem>
                <div className="my-1 border-t" />
                <DropdownMenuItem onClick={() => handleExport('reservations')}>
                  Réservations (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('products')}>
                  Produits (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('users')}>
                  Utilisateurs (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('movements')}>
                  Mouvements (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Period Summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            Période: {new Date(from).toLocaleDateString('fr-FR')} -{' '}
            {new Date(to).toLocaleDateString('fr-FR')}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total réservations</p>
              <p className="text-2xl font-bold">{formatNumber(dashboardStats.reservations.total)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Crédits dépensés</p>
              <p className="text-2xl font-bold">{formatNumber(dashboardStats.credits.totalSpent)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Nouveaux utilisateurs</p>
              <p className="text-2xl font-bold">{formatNumber(dashboardStats.users.newUsers)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Produits utilisés</p>
              <p className="text-2xl font-bold">{formatNumber(dashboardStats.products.uniqueProducts)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ReservationsChart
          data={dashboardStats?.charts.reservationsByDay}
          isLoading={isLoadingDashboard}
        />
        <CreditsChart
          data={dashboardStats?.charts.creditsByDay}
          isLoading={isLoadingDashboard}
        />
      </div>

      <SectionsChart
        data={dashboardStats?.charts.topSections}
        isLoading={isLoadingDashboard}
      />

      {/* Top Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsTable data={topProducts} isLoading={isLoadingProducts} />
        <TopUsersTable data={topUsers} isLoading={isLoadingUsers} />
      </div>

      {/* Sections Stats Table */}
      <SectionsStatsTable data={sectionsStats} isLoading={isLoadingSections} />
    </div>
  )
}
