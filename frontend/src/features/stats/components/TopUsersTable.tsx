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
import { Users, TrendingUp, XCircle, Clock, Coins } from 'lucide-react'
import { formatNumber } from '../utils/statsHelpers'
import type { TopUsers } from '@/api/stats.api'

interface TopUsersTableProps {
  data?: TopUsers
  isLoading?: boolean
}

function UserRow({
  rank,
  name,
  email,
  value,
  valueLabel,
}: {
  rank: number
  name: string
  email: string
  value: number
  valueLabel: string
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{rank}</TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
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
      <Users className="h-8 w-8 mb-2" />
      <p className="text-sm">Aucune donnée</p>
    </div>
  )
}

export function TopUsersTable({ data, isLoading }: TopUsersTableProps) {
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
          <Users className="h-5 w-5" />
          Top Utilisateurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mostActive">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="mostActive" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Actifs
            </TabsTrigger>
            <TabsTrigger value="mostCreditsSpent" className="text-xs">
              <Coins className="h-3 w-3 mr-1" />
              Dépenses
            </TabsTrigger>
            <TabsTrigger value="mostCancellations" className="text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Annulations
            </TabsTrigger>
            <TabsTrigger value="mostOverdue" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Retards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mostActive" className="mt-4">
            {data?.mostActive && data.mostActive.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Réservations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mostActive.map((user, index) => (
                    <UserRow
                      key={user.id}
                      rank={index + 1}
                      name={user.name}
                      email={user.email}
                      value={user.count ?? 0}
                      valueLabel=""
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="mostCreditsSpent" className="mt-4">
            {data?.mostCreditsSpent && data.mostCreditsSpent.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Crédits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mostCreditsSpent.map((user, index) => (
                    <UserRow
                      key={user.id}
                      rank={index + 1}
                      name={user.name}
                      email={user.email}
                      value={user.spent}
                      valueLabel=""
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="mostCancellations" className="mt-4">
            {data?.mostCancellations && data.mostCancellations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Annulations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mostCancellations.map((user, index) => (
                    <UserRow
                      key={user.id}
                      rank={index + 1}
                      name={user.name}
                      email={user.email}
                      value={user.count ?? 0}
                      valueLabel=""
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState />
            )}
          </TabsContent>

          <TabsContent value="mostOverdue" className="mt-4">
            {data?.mostOverdue && data.mostOverdue.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="text-right">Retards</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.mostOverdue.map((user, index) => (
                    <UserRow
                      key={user.id}
                      rank={index + 1}
                      name={user.name}
                      email={user.email}
                      value={user.count ?? 0}
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
