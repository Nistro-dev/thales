import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, TrendingUp, AlertTriangle, Coins } from 'lucide-react'
import { formatNumber } from '../utils/statsHelpers'
import type { TopProducts } from '@/api/stats.api'

interface TopProductsTableProps {
  data?: TopProducts
  isLoading?: boolean
}

function ProductRow({
  rank,
  name,
  reference,
  value,
  valueLabel,
}: {
  rank: number
  name: string
  reference?: string
  value: number
  valueLabel: string
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{rank}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{name}</p>
          {reference && <p className="text-xs text-muted-foreground">{reference}</p>}
        </div>
      </TableCell>
      <TableCell className="text-right">
        {formatNumber(value)} {valueLabel}
      </TableCell>
    </TableRow>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Package className="h-8 w-8 mb-2" />
      <p className="text-sm">Aucune donnée</p>
    </div>
  )
}

export function TopProductsTable({ data, isLoading }: TopProductsTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
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
          <Package className="h-5 w-5" />
          Top Produits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mostReserved">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mostReserved" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Populaires
            </TabsTrigger>
            <TabsTrigger value="bestRevenue" className="text-xs">
              <Coins className="h-3 w-3 mr-1" />
              Revenus
            </TabsTrigger>
            <TabsTrigger value="leastReserved" className="text-xs">
              Peu utilisés
            </TabsTrigger>
            <TabsTrigger value="mostDamaged" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Dégâts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mostReserved" className="mt-4">
            {data?.mostReserved && data.mostReserved.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Réservations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mostReserved.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      rank={index + 1}
                      name={product.name}
                      reference={product.reference}
                      value={product.count ?? 0}
                      valueLabel=""
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="bestRevenue" className="mt-4">
            {data?.bestRevenue && data.bestRevenue.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Crédits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.bestRevenue.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      rank={index + 1}
                      name={product.name}
                      reference={product.reference}
                      value={product.revenue}
                      valueLabel=""
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="leastReserved" className="mt-4">
            {data?.leastReserved && data.leastReserved.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Réservations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.leastReserved.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      rank={index + 1}
                      name={product.name}
                      reference={product.reference}
                      value={product.count ?? 0}
                      valueLabel=""
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="mostDamaged" className="mt-4">
            {data?.mostDamaged && data.mostDamaged.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-right">Incidents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mostDamaged.map((product, index) => (
                    <ProductRow
                      key={product.id}
                      rank={index + 1}
                      name={product.name}
                      reference={product.reference}
                      value={product.damageCount}
                      valueLabel=""
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
