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
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCreateSection, useUpdateSection } from "../hooks/useSectionsAdmin";
import { useMediaQuery } from "@/hooks/useMediaQuery";
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
  const isDesktop = useMediaQuery("(min-width: 640px)");

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

  const formContent = (
    <form
      id="section-form"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
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
          <span className="text-muted-foreground font-normal">(optionnel)</span>
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
          Après la création, vous pourrez configurer les jours autorisés, les
          créneaux horaires et les périodes de fermeture.
        </p>
      )}
    </form>
  );

  const footerContent = (
    <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto sm:justify-end">
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
        form="section-form"
        disabled={isPending}
        className="w-full sm:w-auto"
      >
        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isEditing ? "Enregistrer" : "Créer la section"}
      </Button>
    </div>
  );

  // Mobile: Drawer from bottom
  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FolderPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DrawerTitle>
                  {isEditing ? "Modifier la section" : "Nouvelle section"}
                </DrawerTitle>
                <DrawerDescription>
                  {isEditing
                    ? "Modifiez les informations de la section"
                    : "Créez une nouvelle catégorie de produits"}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>
          <div className="px-4 pb-2">{formContent}</div>
          <DrawerFooter className="pt-2">{footerContent}</DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FolderPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
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
        <div className="py-2">{formContent}</div>
        <div className="flex justify-end">{footerContent}</div>
      </DialogContent>
    </Dialog>
  );
}
