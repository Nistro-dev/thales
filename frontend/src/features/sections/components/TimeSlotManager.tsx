import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Clock, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import {
  useTimeSlots,
  useCreateTimeSlot,
  useDeleteTimeSlot,
} from "../hooks/useSectionsAdmin";
import type { TimeSlot, SlotType } from "@/types";

// ============================================
// CONSTANTS
// ============================================

const DAYS = [
  { value: 0, label: "Dimanche", short: "Dim" },
  { value: 1, label: "Lundi", short: "Lun" },
  { value: 2, label: "Mardi", short: "Mar" },
  { value: 3, label: "Mercredi", short: "Mer" },
  { value: 4, label: "Jeudi", short: "Jeu" },
  { value: 5, label: "Vendredi", short: "Ven" },
  { value: 6, label: "Samedi", short: "Sam" },
];

const SLOT_TYPES: { value: SlotType; label: string }[] = [
  { value: "CHECKOUT", label: "Retrait" },
  { value: "RETURN", label: "Retour" },
];

// Generate time options with 15-minute intervals
const generateTimeOptions = () => {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (const minute of [0, 15, 30, 45]) {
      const h = hour.toString().padStart(2, "0");
      const m = minute.toString().padStart(2, "0");
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

// ============================================
// SCHEMA
// ============================================

const timeSlotSchema = z
  .object({
    type: z.enum(["CHECKOUT", "RETURN"]),
    dayOfWeek: z.coerce.number().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:mm"),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["endTime"],
  });

type TimeSlotFormData = z.infer<typeof timeSlotSchema>;

// ============================================
// TIME SLOT FORM DIALOG
// ============================================

interface TimeSlotFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: string;
  defaultType?: SlotType;
}

function TimeSlotFormDialog({
  open,
  onOpenChange,
  sectionId,
  defaultType = "CHECKOUT",
}: TimeSlotFormDialogProps) {
  const createTimeSlot = useCreateTimeSlot();

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      type: defaultType,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "12:00",
    },
  });

  const watchType = watch("type");
  const watchDayOfWeek = watch("dayOfWeek");
  const watchStartTime = watch("startTime");
  const watchEndTime = watch("endTime");

  const onSubmit = async (data: TimeSlotFormData) => {
    try {
      await createTimeSlot.mutateAsync({
        sectionId,
        data: {
          type: data.type,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      });
      reset();
      onOpenChange(false);
    } catch {
      // Error handled in hook
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset({
        type: defaultType,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "12:00",
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau créneau horaire</DialogTitle>
          <DialogDescription>
            Définissez un créneau pendant lequel les utilisateurs peuvent
            effectuer un retrait ou retour.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={watchType}
                onValueChange={(value: SlotType) => setValue("type", value)}
                disabled={createTimeSlot.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Jour *</Label>
              <Select
                value={String(watchDayOfWeek)}
                onValueChange={(value) => setValue("dayOfWeek", Number(value))}
                disabled={createTimeSlot.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Heure de début *</Label>
              <Select
                value={watchStartTime}
                onValueChange={(value) => setValue("startTime", value)}
                disabled={createTimeSlot.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.startTime && (
                <p className="text-sm text-destructive">
                  {errors.startTime.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Heure de fin *</Label>
              <Select
                value={watchEndTime}
                onValueChange={(value) => setValue("endTime", value)}
                disabled={createTimeSlot.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.endTime && (
                <p className="text-sm text-destructive">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createTimeSlot.isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={createTimeSlot.isPending}>
              {createTimeSlot.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// TIME SLOT LIST BY DAY
// ============================================

interface TimeSlotListProps {
  slots: TimeSlot[];
  sectionId: string;
  onDelete: (slot: TimeSlot) => void;
}

function TimeSlotList({ slots, onDelete }: TimeSlotListProps) {
  // Group by day
  const slotsByDay = DAYS.map((day) => ({
    ...day,
    slots: slots.filter((s) => s.dayOfWeek === day.value),
  }));

  const hasAnySlots = slots.length > 0;

  if (!hasAnySlots) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun créneau défini</p>
        <p className="text-sm">
          Les utilisateurs peuvent effectuer des opérations à n'importe quelle
          heure
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {slotsByDay
        .filter((day) => day.slots.length > 0)
        .map((day) => (
          <div key={day.value} className="flex items-start gap-4">
            <div className="w-20 pt-2 text-sm font-medium text-muted-foreground">
              {day.label}
            </div>
            <div className="flex-1 flex flex-wrap gap-2">
              {day.slots.map((slot) => (
                <Badge
                  key={slot.id}
                  variant="secondary"
                  className="flex items-center gap-2 px-3 py-1.5"
                >
                  <Clock className="h-3 w-3" />
                  {slot.startTime} - {slot.endTime}
                  <button
                    type="button"
                    onClick={() => onDelete(slot)}
                    className="ml-1 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface TimeSlotManagerProps {
  sectionId: string;
}

export function TimeSlotManager({ sectionId }: TimeSlotManagerProps) {
  const { data: timeSlots, isLoading } = useTimeSlots(sectionId);
  const deleteTimeSlot = useDeleteTimeSlot();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<SlotType>("CHECKOUT");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState<TimeSlot | null>(null);

  const checkoutSlots = timeSlots?.filter((s) => s.type === "CHECKOUT") || [];
  const returnSlots = timeSlots?.filter((s) => s.type === "RETURN") || [];

  const handleAddSlot = (type: SlotType) => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const handleDeleteSlot = (slot: TimeSlot) => {
    setDeletingSlot(slot);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingSlot) return;
    try {
      await deleteTimeSlot.mutateAsync({
        slotId: deletingSlot.id,
        sectionId,
      });
      setDeleteDialogOpen(false);
      setDeletingSlot(null);
    } catch {
      // Error handled in hook
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Créneaux horaires
          </CardTitle>
          <CardDescription>
            Définissez les plages horaires pendant lesquelles les retraits et
            retours sont autorisés. Si aucun créneau n'est défini, les
            opérations sont possibles à tout moment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="checkout" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="checkout" className="flex items-center gap-2">
                Retrait
                {checkoutSlots.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {checkoutSlots.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="return" className="flex items-center gap-2">
                Retour
                {returnSlots.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {returnSlots.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checkout" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleAddSlot("CHECKOUT")}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>
              </div>
              <TimeSlotList
                slots={checkoutSlots}
                sectionId={sectionId}
                onDelete={handleDeleteSlot}
              />
            </TabsContent>

            <TabsContent value="return" className="space-y-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleAddSlot("RETURN")}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un créneau
                </Button>
              </div>
              <TimeSlotList
                slots={returnSlots}
                sectionId={sectionId}
                onDelete={handleDeleteSlot}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <TimeSlotFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sectionId={sectionId}
        defaultType={dialogType}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le créneau ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ce créneau {deletingSlot?.startTime} - {deletingSlot?.endTime} le{" "}
              {deletingSlot && DAYS[deletingSlot.dayOfWeek]?.label} sera
              supprimé. Les utilisateurs pourront effectuer des opérations en
              dehors de cette plage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTimeSlot.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
