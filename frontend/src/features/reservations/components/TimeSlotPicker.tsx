import { useMemo } from "react";
import { Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TimeSlot } from "@/types";

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

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  onTimeChange: (time: string | undefined) => void;
  label: string;
  disabled?: boolean;
}

const DAY_NAMES = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
];

export function TimeSlotPicker({
  slots,
  selectedDate,
  selectedTime,
  onTimeChange,
  label,
  disabled = false,
}: TimeSlotPickerProps) {
  // Get slots for the selected day
  const availableSlots = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = selectedDate.getDay();
    return slots.filter((slot) => slot.dayOfWeek === dayOfWeek);
  }, [slots, selectedDate]);

  // Filter time options to only show those within available slots
  const availableTimeOptions = useMemo(() => {
    if (availableSlots.length === 0) return [];
    return TIME_OPTIONS.filter((time) =>
      availableSlots.some(
        (slot) => time >= slot.startTime && time <= slot.endTime,
      ),
    );
  }, [availableSlots]);

  // Check if selected time is in a valid slot
  const isTimeValid = useMemo(() => {
    if (!selectedTime || availableSlots.length === 0) return true;
    return availableSlots.some(
      (slot) => selectedTime >= slot.startTime && selectedTime <= slot.endTime,
    );
  }, [selectedTime, availableSlots]);

  // Check if time is required but not provided
  const isTimeRequired = availableSlots.length > 0;
  const isTimeMissing = isTimeRequired && !selectedTime;

  // If no slots defined, don't show the picker
  if (slots.length === 0) {
    return null;
  }

  // If no date selected yet
  if (!selectedDate) {
    return null;
  }

  // If no slots for this specific day - show warning
  if (availableSlots.length === 0) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">{label}</Label>
        <div className="rounded-md border border-orange-200 bg-orange-50 p-2">
          <div className="flex items-center gap-2 text-xs text-orange-700">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>Aucun créneau le {DAY_NAMES[selectedDate.getDay()]}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>

      {/* Available slots display */}
      <div className="flex flex-wrap gap-1">
        {availableSlots.map((slot) => (
          <Badge
            key={slot.id}
            variant="outline"
            className="text-[10px] px-1.5 py-0.5 bg-background"
          >
            <Clock className="h-2.5 w-2.5 mr-1" />
            {slot.startTime}-{slot.endTime}
          </Badge>
        ))}
      </div>

      {/* Time select with 15-minute intervals */}
      <Select
        value={selectedTime || ""}
        onValueChange={(value) => onTimeChange(value || undefined)}
        disabled={disabled}
      >
        <SelectTrigger
          className={`h-8 text-sm ${
            !isTimeValid
              ? "border-destructive focus-visible:ring-destructive"
              : selectedTime && isTimeValid
                ? "border-green-500 focus-visible:ring-green-500"
                : ""
          }`}
        >
          <SelectValue placeholder="Sélectionner une heure" />
        </SelectTrigger>
        <SelectContent>
          {availableTimeOptions.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status messages */}
      {selectedTime && isTimeValid && (
        <p className="text-[10px] text-green-600 flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Horaire valide
        </p>
      )}

      {selectedTime && !isTimeValid && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-1.5">
          <p className="text-[10px] text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3 shrink-0" />
            Choisissez une heure dans un créneau ci-dessus
          </p>
        </div>
      )}

      {isTimeMissing && (
        <p className="text-[10px] text-muted-foreground">
          Sélectionnez une heure
        </p>
      )}
    </div>
  );
}
