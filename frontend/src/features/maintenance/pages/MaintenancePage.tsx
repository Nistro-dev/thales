import { Construction, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MaintenancePageProps {
  message?: string
}

export function MaintenancePage({ message }: MaintenancePageProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/20 mb-6">
            <Construction className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Maintenance en cours
          </h1>
          <p className="text-muted-foreground text-lg">
            {message || "L'application est en maintenance. Veuillez réessayer plus tard."}
          </p>
        </div>

        <Button
          onClick={handleRefresh}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </Button>

        <p className="mt-8 text-sm text-muted-foreground">
          Nous nous excusons pour la gêne occasionnée.
        </p>
      </div>
    </div>
  )
}
