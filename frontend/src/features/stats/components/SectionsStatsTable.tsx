import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FolderOpen } from 'lucide-react'
import { formatNumber } from '../utils/statsHelpers'
import type { SectionStats } from '@/api/stats.api'

interface SectionsStatsTableProps {
  data?: SectionStats[]
  isLoading?: boolean
}

export function SectionsStatsTable({ data, isLoading }: SectionsStatsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Statistiques par section
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mb-2" />
            <p className="text-sm">Aucune donnée</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-right">Produits</TableHead>
                  <TableHead className="text-right">Réservations</TableHead>
                  <TableHead className="text-right">Crédits</TableHead>
                  <TableHead className="text-right">Utilisation</TableHead>
                  <TableHead className="text-right">Dégâts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((section) => (
                  <TableRow key={section.id}>
                    <TableCell className="font-medium">{section.name}</TableCell>
                    <TableCell className="text-right">
                      {section.activeProducts}/{section.totalProducts}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(section.totalReservations)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(section.creditsGenerated)}
                    </TableCell>
                    <TableCell className="text-right">{section.averageUtilization}x</TableCell>
                    <TableCell className="text-right">
                      {section.damageReports > 0 ? (
                        <span className="text-destructive">{section.damageReports}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
