import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProductFile } from '@/types'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  files: ProductFile[]
  productName: string
}

export function ProductGallery({ files, productName }: ProductGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filter only image files
  const images = files.filter((file) => file.mimeType.startsWith('image/'))

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted">
        <div className="text-center">
          <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Aucune image disponible</p>
        </div>
      </div>
    )
  }

  const currentImage = images[currentIndex]

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
        <img
          src={currentImage.url}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="h-full w-full object-contain"
        />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={goToNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Image Counter */}
            <div className="absolute bottom-2 right-2 rounded-md bg-black/50 px-2 py-1 text-xs text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-all',
                index === currentIndex
                  ? 'border-primary'
                  : 'border-transparent opacity-50 hover:opacity-100'
              )}
            >
              <img
                src={image.url}
                alt={`${productName} - Miniature ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
