import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Coins } from 'lucide-react'

interface CreditBalanceProps {
  credits: number
}

export function CreditBalance({ credits }: CreditBalanceProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Coins className="h-5 w-5 text-yellow-500" />
          Solde de crédits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{credits}</span>
          <span className="text-muted-foreground">crédits</span>
        </div>
      </CardContent>
    </Card>
  )
}
