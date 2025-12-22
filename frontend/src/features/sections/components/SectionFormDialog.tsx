import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateSection, useUpdateSection } from "../hooks/useSectionsAdmin";
import type { Section } from "@/types";

// Schema simplifié - juste nom et description pour la création
const sectionSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100),
  description: z.string().max(500).optional(),
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: Section | null;
  onCreated?: (sectionId: string) => void;
}

export function SectionFormDialog({
  open,
  onOpenChange,
  section,
  onCreated,
}: SectionFormDialogProps) {
  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const isEditing = !!section;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  useEffect(() => {
    if (section) {
      reset({
        name: section.name,
        description: section.description || "",
      });
    } else {
      reset({
        name: "",
        description: "",
      });
    }
  }, [section, reset, open]);

  const onSubmit = async (data: SectionFormData) => {
    try {
      if (isEditing && section) {
        await updateSection.mutateAsync({ id: section.id, data });
        onOpenChange(false);
      } else {
        const response = await createSection.mutateAsync(data);
        onOpenChange(false);
        // Rediriger vers le détail de la section créée
        if (onCreated && response.data.data?.id) {
          onCreated(response.data.data.id);
        }
      }
    } catch {
      // Error handled in hook
    }
  };

  const isPending = createSection.isPending || updateSection.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle>
                {isEditing ? "Modifier la section" : "Nouvelle section"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Modifiez les informations de la section"
                  : "Créez une nouvelle catégorie de produits"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nom de la section *
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Ex: Photo, Vidéo, Son..."
              disabled={isPending}
              className="h-11"
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optionnel)
              </span>
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Décrivez brièvement cette section..."
              disabled={isPending}
              rows={3}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {!isEditing && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              Après la création, vous pourrez configurer les jours autorisés,
              les créneaux horaires et les périodes de fermeture.
            </p>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-3 sm:gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer la section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
