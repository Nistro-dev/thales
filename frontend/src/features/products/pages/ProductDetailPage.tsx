import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProduct } from '../hooks/useProduct'
import { ProductGallery } from '../components/ProductGallery'
import { ProductDetailSkeleton } from '../components/ProductDetailSkeleton'
import { AvailabilityBadge } from '../components/AvailabilityBadge'
import { ReservationModal } from '@/features/reservations/components/ReservationModal'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: product, isLoading, isError } = useProduct(id!)
  const [reservationModalOpen, setReservationModalOpen] = useState(false)

  if (isLoading) {
    return <ProductDetailSkeleton />
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Produit introuvable</p>
          <Button asChild variant="link" className="mt-4">
            <Link to="/products">Retour aux produits</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Back Button */}
      <Button asChild variant="ghost" className="mb-6">
        <Link to="/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux produits
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left Column - Gallery */}
        <div>
          <ProductGallery files={product.files || []} productName={product.name} />
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="mb-2 flex items-start justify-between gap-4">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <AvailabilityBadge status={product.status} />
            </div>
            {product.reference && (
              <p className="text-sm text-muted-foreground">Référence : {product.reference}</p>
            )}
          </div>

          {/* Price */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prix de location</CardTitle>
            </CardHeader>
            <CardContent>
              {product.priceCredits !== null ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{product.priceCredits}</span>
                  <span className="text-muted-foreground">crédits / jour</span>
                </div>
              ) : (
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Vous devez valider votre caution pour voir les prix
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Section</p>
                  <p className="text-sm text-muted-foreground">{product.section.name}</p>
                </div>
              </div>

              {product.subSection && (
                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Sous-section</p>
                    <p className="text-sm text-muted-foreground">{product.subSection.name}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Durée de location</p>
                  <p className="text-sm text-muted-foreground">
                    {product.minDuration} à {product.maxDuration} jours
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attributes */}
          {product.attributes && product.attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  {product.attributes.map((attr) => (
                    <div key={attr.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <dt className="text-sm font-medium capitalize">{attr.key}</dt>
                      <dd className="text-sm text-muted-foreground">{attr.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{product.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Reserve Button */}
          <Button
            size="lg"
            className="w-full"
            disabled={product.status !== 'AVAILABLE'}
            onClick={() => setReservationModalOpen(true)}
          >
            <Calendar className="mr-2 h-5 w-5" />
            {product.status === 'AVAILABLE' ? 'Réserver ce produit' : 'Indisponible'}
          </Button>
        </div>
      </div>

      {/* Reservation Modal */}
      {product && (
        <ReservationModal
          product={product}
          open={reservationModalOpen}
          onOpenChange={setReservationModalOpen}
        />
      )}
    </div>
  )
}
