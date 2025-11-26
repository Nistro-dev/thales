import { AlertCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary?: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>Une erreur est survenue</CardTitle>
              <CardDescription>
                Nous sommes désolés, quelque chose s'est mal passé. Veuillez réessayer.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="text-sm font-medium">Détails techniques</span>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-3">
              <div className="rounded-lg border bg-muted p-4">
                <h4 className="mb-2 text-sm font-semibold">Message d'erreur:</h4>
                <p className="text-sm text-destructive">{error.message}</p>
              </div>

              {error.stack && (
                <div className="rounded-lg border bg-muted p-4">
                  <h4 className="mb-2 text-sm font-semibold">Stack trace:</h4>
                  <pre className="max-h-64 overflow-auto text-xs">
                    <code>{error.stack}</code>
                  </pre>
                </div>
              )}

              <div className="rounded-lg border bg-muted p-4">
                <h4 className="mb-2 text-sm font-semibold">Informations:</h4>
                <dl className="space-y-1 text-xs">
                  <div className="flex gap-2">
                    <dt className="font-semibold">Type:</dt>
                    <dd className="text-muted-foreground">{error.name}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-semibold">URL:</dt>
                    <dd className="text-muted-foreground">{window.location.href}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-semibold">Timestamp:</dt>
                    <dd className="text-muted-foreground">{new Date().toLocaleString('fr-FR')}</dd>
                  </div>
                </dl>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>

        <CardFooter className="flex gap-2">
          {resetErrorBoundary && (
            <Button onClick={resetErrorBoundary} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Réessayer
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/')}
            className="flex-1"
          >
            Retour à l'accueil
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
