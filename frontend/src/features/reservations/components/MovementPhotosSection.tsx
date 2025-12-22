import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Camera, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { ReservationMovement, ProductCondition } from "@/types";

interface MovementPhotosSectionProps {
  movements?: ReservationMovement[];
}

const conditionLabels: Record<
  ProductCondition,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  OK: { label: "OK", variant: "default" },
  MINOR_DAMAGE: { label: "Dégâts mineurs", variant: "secondary" },
  MAJOR_DAMAGE: { label: "Dégâts majeurs", variant: "destructive" },
  MISSING_PARTS: { label: "Pièces manquantes", variant: "destructive" },
  BROKEN: { label: "Cassé", variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  CHECKOUT: "Retrait",
  RETURN: "Retour",
  STATUS_CHANGE: "Changement de statut",
};

export function MovementPhotosSection({
  movements,
}: MovementPhotosSectionProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<
    Array<{ url: string; caption?: string | null; filename?: string }>
  >([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Filter movements that have photos
  const movementsWithPhotos =
    movements?.filter((m) => m.photos && m.photos.length > 0) || [];

  if (movementsWithPhotos.length === 0) {
    return null;
  }

  const openLightbox = (photos: typeof lightboxImages, index: number) => {
    setLightboxImages(photos);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Photos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {movementsWithPhotos.map((movement) => {
            const conditionInfo = movement.condition
              ? conditionLabels[movement.condition]
              : null;

            const photos = (movement.photos || []).map((p) => ({
              url: p.url || "",
              caption: p.caption,
              filename: p.filename,
            }));

            return (
              <div key={movement.id} className="space-y-3">
                {/* Movement header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {typeLabels[movement.type] || movement.type}
                    </Badge>
                    {conditionInfo && (
                      <Badge variant={conditionInfo.variant}>
                        {conditionInfo.label}
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(
                      new Date(movement.performedAt),
                      "dd MMM yyyy 'à' HH:mm",
                      {
                        locale: fr,
                      },
                    )}
                  </span>
                </div>

                {/* Photos grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {movement.photos?.map((photo, index) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border bg-muted"
                      onClick={() => openLightbox(photos, index)}
                    >
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={
                            photo.caption ||
                            photo.filename ||
                            `Photo ${index + 1}`
                          }
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                        <span className="text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          Agrandir
                        </span>
                      </div>
                      {/* Caption preview */}
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-xs text-white line-clamp-1">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {movement.notes && (
                  <p className="text-sm text-muted-foreground italic">
                    {movement.notes}
                  </p>
                )}

                {/* Performed by */}
                {movement.performedByUser && (
                  <p className="text-xs text-muted-foreground">
                    Par {movement.performedByUser.firstName}{" "}
                    {movement.performedByUser.lastName}
                  </p>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
