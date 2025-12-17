import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { ROUTES } from "@/constants/routes";
import { useSectionDetail, useUpdateSection } from "../hooks/useSectionsAdmin";
import {
  useClosures,
  useCreateClosure,
  useUpdateClosure,
  useDeleteClosure,
} from "../hooks/useClosures";
import type { SectionClosure } from "@/types";

// ============================================
// SCHEMAS
// ============================================

const sectionSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100),
  description: z.string().max(500).optional(),
  allowedDaysIn: z.array(z.number()).default([1, 2, 3, 4, 5]),
  allowedDaysOut: z.array(z.number()).default([1, 2, 3, 4, 5]),
  refundDeadlineHours: z.coerce.number().int().min(0).default(48),
});

const closureSchema = z.object({
  startDate: z.string().min(1, "Date de début requise"),
  endDate: z.string().min(1, "Date de fin requise"),
  reason: z.string().min(1, "Raison requise").max(200),
});

type SectionFormData = z.infer<typeof sectionSchema>;
type ClosureFormData = z.infer<typeof closureSchema>;

const DAYS = [
  { value: 0, label: "Dim" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
];

// ============================================
// CLOSURE FORM DIALOG
// ============================================

interface ClosureFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  closure?: SectionClosure | null;
}

function ClosureFormDialog({
  open,
  onOpenChange,
  sectionId,
  closure,
}: ClosureFormDialogProps) {
  const createClosure = useCreateClosure();
  const updateClosure = useUpdateClosure();
  const isEditing = !!closure;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClosureFormData>({
    resolver: zodResolver(closureSchema),
  });

  useEffect(() => {
    if (closure) {
      reset({
        startDate: closure.startDate.split("T")[0],
        endDate: closure.endDate.split("T")[0],
        reason: closure.reason,
      });
    } else {
      reset({
        startDate: "",
        endDate: "",
        reason: "",
      });
    }
  }, [closure, reset, open]);

  const onSubmit = async (data: ClosureFormData) => {
    try {
      if (isEditing && closure) {
        await updateClosure.mutateAsync({
          closureId: closure.id,
          sectionId,
          data,
        });
      } else {
        await createClosure.mutateAsync({
          sectionId,
          data,
        });
      }
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  const isPending = createClosure.isPending || updateClosure.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Modifier la fermeture" : "Nouvelle fermeture"}
          </DialogTitle>
          <DialogDescription>
            Pendant une période de fermeture, les retraits et retours de
            produits ne seront pas possibles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Date de début *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                disabled={isPending}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin *</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                disabled={isPending}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Raison *</Label>
            <Input
              id="reason"
              {...register("reason")}
              placeholder="Ex: Vacances d'été, Fermeture annuelle..."
              disabled={isPending}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">
                {errors.reason.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export function AdminSectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: section, isLoading, isError } = useSectionDetail(id);
  const { data: closures, isLoading: closuresLoading } = useClosures(id);
  const updateSection = useUpdateSection();
  const deleteClosure = useDeleteClosure();

  // Closure dialog
  const [closureDialogOpen, setClosureDialogOpen] = useState(false);
  const [editingClosure, setEditingClosure] = useState<SectionClosure | null>(
    null,
  );

  // Delete closure dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClosure, setDeletingClosure] = useState<SectionClosure | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
      description: "",
      allowedDaysIn: [1, 2, 3, 4, 5],
      allowedDaysOut: [1, 2, 3, 4, 5],
      refundDeadlineHours: 48,
    },
  });

  const allowedDaysIn = watch("allowedDaysIn");
  const allowedDaysOut = watch("allowedDaysOut");

  useEffect(() => {
    if (section) {
      reset({
        name: section.name,
        description: section.description || "",
        allowedDaysIn: section.allowedDaysIn || [1, 2, 3, 4, 5],
        allowedDaysOut: section.allowedDaysOut || [1, 2, 3, 4, 5],
        refundDeadlineHours: section.refundDeadlineHours ?? 48,
      });
    }
  }, [section, reset]);

  const toggleDay = (
    field: "allowedDaysIn" | "allowedDaysOut",
    day: number,
  ) => {
    const current = field === "allowedDaysIn" ? allowedDaysIn : allowedDaysOut;
    if (current.includes(day)) {
      setValue(
        field,
        current.filter((d) => d !== day),
        { shouldDirty: true },
      );
    } else {
      setValue(field, [...current, day].sort(), { shouldDirty: true });
    }
  };

  const onSubmit = async (data: SectionFormData) => {
    if (!id) return;
    try {
      await updateSection.mutateAsync({ id, data });
    } catch {
      // Error handled in hook
    }
  };

  const handleAddClosure = () => {
    setEditingClosure(null);
    setClosureDialogOpen(true);
  };

  const handleEditClosure = (closure: SectionClosure) => {
    setEditingClosure(closure);
    setClosureDialogOpen(true);
  };

  const handleDeleteClosure = (closure: SectionClosure) => {
    setDeletingClosure(closure);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteClosure = async () => {
    if (!deletingClosure || !id) return;
    try {
      await deleteClosure.mutateAsync({
        closureId: deletingClosure.id,
        sectionId: id,
      });
      setDeleteDialogOpen(false);
      setDeletingClosure(null);
    } catch {
      // Error handled in hook
    }
  };

  const isClosurePast = (closure: SectionClosure) => {
    return isBefore(parseISO(closure.endDate), startOfDay(new Date()));
  };

  const isClosureCurrent = (closure: SectionClosure) => {
    const today = startOfDay(new Date());
    const start = parseISO(closure.startDate);
    const end = parseISO(closure.endDate);
    return !isBefore(end, today) && !isBefore(today, start);
  };

  const getClosureStatus = (closure: SectionClosure) => {
    if (isClosurePast(closure)) return "past";
    if (isClosureCurrent(closure)) return "current";
    return "future";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !section) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Section introuvable</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate(ROUTES.ADMIN_SECTIONS)}
          >
            Retour aux sections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(ROUTES.ADMIN_SECTIONS)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{section.name}</h1>
            <p className="text-sm text-muted-foreground">
              Modifier les paramètres de la section
            </p>
          </div>
        </div>
        {isDirty && (
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={updateSection.isPending}
          >
            {updateSection.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        )}
      </div>

      {/* Section Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
          <CardDescription>
            Modifiez les informations de base de la section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Ex: Photo, Vidéo, Son..."
                  disabled={updateSection.isPending}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="refundDeadlineHours">
                  Délai d'annulation pour remboursement (heures)
                </Label>
                <Input
                  id="refundDeadlineHours"
                  type="number"
                  min="0"
                  {...register("refundDeadlineHours")}
                  disabled={updateSection.isPending}
                />
                {errors.refundDeadlineHours && (
                  <p className="text-sm text-destructive">
                    {errors.refundDeadlineHours.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Description de la section (optionnel)"
                disabled={updateSection.isPending}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Jours autorisés pour récupération</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS.map((day) => (
                    <label
                      key={`in-${day.value}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={allowedDaysIn.includes(day.value)}
                        onCheckedChange={() =>
                          toggleDay("allowedDaysIn", day.value)
                        }
                        disabled={updateSection.isPending}
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Jours autorisés pour retour</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DAYS.map((day) => (
                    <label
                      key={`out-${day.value}`}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={allowedDaysOut.includes(day.value)}
                        onCheckedChange={() =>
                          toggleDay("allowedDaysOut", day.value)
                        }
                        disabled={updateSection.isPending}
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Closures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Périodes de fermeture
            </CardTitle>
            <CardDescription>
              Pendant une fermeture, les retraits et retours ne sont pas
              autorisés
            </CardDescription>
          </div>
          <Button onClick={handleAddClosure} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {closuresLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : closures && closures.length > 0 ? (
            <div className="space-y-3">
              {closures.map((closure) => {
                const status = getClosureStatus(closure);
                const isPast = status === "past";

                return (
                  <div
                    key={closure.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      status === "current"
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                        : isPast
                          ? "border-muted bg-muted/30 opacity-60"
                          : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {status === "current" && (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                        {status === "future" && (
                          <Calendar className="h-5 w-5 text-blue-500" />
                        )}
                        {status === "past" && (
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{closure.reason}</span>
                          {status === "current" && (
                            <Badge
                              variant="secondary"
                              className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                            >
                              En cours
                            </Badge>
                          )}
                          {status === "future" && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                            >
                              A venir
                            </Badge>
                          )}
                          {status === "past" && (
                            <Badge variant="secondary">Passée</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Du{" "}
                          {format(parseISO(closure.startDate), "dd MMMM yyyy", {
                            locale: fr,
                          })}{" "}
                          au{" "}
                          {format(parseISO(closure.endDate), "dd MMMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                    {!isPast && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClosure(closure)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClosure(closure)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune période de fermeture définie</p>
              <p className="text-sm">
                Ajoutez une fermeture pour bloquer les retraits et retours
                pendant une période
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Closure Dialog */}
      {id && (
        <ClosureFormDialog
          open={closureDialogOpen}
          onOpenChange={setClosureDialogOpen}
          sectionId={id}
          closure={editingClosure}
        />
      )}

      {/* Delete Closure Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la fermeture ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la période de fermeture "
              {deletingClosure?.reason}". Les retraits et retours seront à
              nouveau autorisés sur cette période.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClosure}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteClosure.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
