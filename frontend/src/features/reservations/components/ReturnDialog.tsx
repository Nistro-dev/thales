import { useState, useRef, useCallback } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Camera, ImagePlus, X } from "lucide-react";
import type { ProductCondition } from "@/types";

const conditionLabels: Record<ProductCondition, string> = {
  OK: "OK - En bon état",
  MINOR_DAMAGE: "Dommages mineurs",
  MAJOR_DAMAGE: "Dommages majeurs",
  MISSING_PARTS: "Pièces manquantes",
  BROKEN: "Cassé",
};

interface PhotoWithCaption {
  file: File;
  preview: string;
  caption: string;
}

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (
    condition: ProductCondition,
    notes?: string,
    photos?: Array<{ file: File; caption?: string }>,
  ) => Promise<void>;
  productName?: string;
  userName?: string;
  isLoading?: boolean;
}

export function ReturnDialog({
  open,
  onOpenChange,
  onConfirm,
  productName,
  userName,
  isLoading = false,
}: ReturnDialogProps) {
  const [condition, setCondition] = useState<ProductCondition>("OK");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoWithCaption[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const newPhotos: PhotoWithCaption[] = [];

    Array.from(files).forEach((file) => {
      if (validTypes.includes(file.type)) {
        newPhotos.push({
          file,
          preview: URL.createObjectURL(file),
          caption: "",
        });
      }
    });

    setPhotos((prev) => [...prev, ...newPhotos]);
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const photo = prev[index];
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleCaptionChange = useCallback((index: number, caption: string) => {
    setPhotos((prev) =>
      prev.map((photo, i) => (i === index ? { ...photo, caption } : photo)),
    );
  }, []);

  const handleConfirm = async () => {
    const photosToSend =
      photos.length > 0
        ? photos.map((p) => ({
            file: p.file,
            caption: p.caption || undefined,
          }))
        : undefined;

    await onConfirm(condition, notes || undefined, photosToSend);
    resetState();
  };

  const resetState = () => {
    photos.forEach((photo) => URL.revokeObjectURL(photo.preview));
    setCondition("OK");
    setNotes("");
    setPhotos([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer le retour</AlertDialogTitle>
          <AlertDialogDescription>
            {productName && userName ? (
              <>
                Vous allez effectuer le retour de <strong>{productName}</strong>{" "}
                par <strong>{userName}</strong>.
              </>
            ) : (
              "Vous allez effectuer le retour du matériel."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condition">État du matériel</Label>
            <Select
              value={condition}
              onValueChange={(value) => setCondition(value as ProductCondition)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez l'état" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(conditionLabels) as [
                    ProductCondition,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="return-notes">Notes (optionnel)</Label>
            <Textarea
              id="return-notes"
              placeholder="Ajoutez des notes pour ce retour..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Photo upload section */}
          <div className="space-y-2">
            <Label>Photos (optionnel)</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={isLoading}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                Galerie
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isLoading}
              >
                <Camera className="mr-2 h-4 w-4" />
                Photo
              </Button>
            </div>

            {/* Photo previews */}
            {photos.length > 0 && (
              <div className="mt-3 space-y-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative rounded-lg border bg-muted/30 p-2"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md">
                        <img
                          src={photo.preview}
                          alt={`Photo ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                          disabled={isLoading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <Input
                          placeholder="Ajouter une description..."
                          value={photo.caption}
                          onChange={(e) =>
                            handleCaptionChange(index, e.target.value)
                          }
                          disabled={isLoading}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              "Confirmer le retour"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
