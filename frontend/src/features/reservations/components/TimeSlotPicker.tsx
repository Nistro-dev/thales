import { useMemo } from "react";
import { Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { TimeSlot } from "@/types";

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

  // Check if selected time is in a valid slot
  const isTimeValid = useMemo(() => {
    if (!selectedTime || availableSlots.length === 0) return true;
    return availableSlots.some(
      (slot) => selectedTime >= slot.startTime && selectedTime <= slot.endTime,
    );
  }, [selectedTime, availableSlots]);

  // If no slots defined, don't show the picker
  if (slots.length === 0) {
    return null;
  }

  // If no date selected yet
  if (!selectedDate) {
    return null;
  }

  // If no slots for this specific day
  if (availableSlots.length === 0) {
    return (
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-3 w-3" />
          <span>
            Aucun créneau défini le {DAY_NAMES[selectedDate.getDay()]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>

      {/* Available slots display */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {availableSlots.map((slot) => (
          <Badge
            key={slot.id}
            variant="outline"
            className="text-[10px] px-2 py-0.5"
          >
            <Clock className="h-2.5 w-2.5 mr-1" />
            {slot.startTime} - {slot.endTime}
          </Badge>
        ))}
      </div>

      {/* Time input */}
      <Input
        type="time"
        value={selectedTime || ""}
        onChange={(e) => onTimeChange(e.target.value || undefined)}
        disabled={disabled}
        className={`h-8 text-sm ${!isTimeValid ? "border-destructive" : ""}`}
      />

      {/* Validation message */}
      {selectedTime && !isTimeValid && (
        <p className="text-[10px] text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          L'heure doit être dans un créneau autorisé
        </p>
      )}
    </div>
  );
}
