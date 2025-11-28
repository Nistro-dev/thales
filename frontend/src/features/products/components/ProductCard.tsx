import { Link } from 'react-router-dom'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { AvailabilityBadge } from './AvailabilityBadge'
import type { Product } from '@/types'
import { ImageIcon } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const thumbnailUrl = product.thumbnail?.url || product.files?.[0]?.url

  return (
    <Link to={`/products/${product.id}`} className="block transition-transform hover:scale-[1.02]">
      <Card className="h-full overflow-hidden">
        {/* Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}

          {/* Status badge */}
          <div className="absolute right-2 top-2">
            <AvailabilityBadge status={product.status} />
          </div>
        </div>

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="line-clamp-1 font-semibold">{product.name}</h3>
              {product.reference && (
                <p className="text-sm text-muted-foreground">{product.reference}</p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          {product.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-md bg-muted px-2 py-1">{product.section.name}</span>
            {product.subSection && (
              <span className="rounded-md bg-muted px-2 py-1">{product.subSection.name}</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Prix</span>
            {product.priceCredits !== null ? (
              <span className="text-lg font-bold">{product.priceCredits} crédits</span>
            ) : (
              <span className="text-sm text-muted-foreground">Caution requise</span>
            )}
          </div>

          <div className="flex flex-col items-end text-xs text-muted-foreground">
            <span>Durée : {product.minDuration}-{product.maxDuration} jours</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
