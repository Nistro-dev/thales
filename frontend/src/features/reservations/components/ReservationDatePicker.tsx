import { useMemo, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle } from "lucide-react";
import { AvailabilityCalendar } from "./AvailabilityCalendar";
import { TimeSlotPicker } from "./TimeSlotPicker";
import { useProductAvailability } from "../hooks/useReservations";
import type { Product, TimeSlot } from "@/types";

interface ReservationDatePickerProps {
  product: Product;
  startDate: Date | undefined;
  endDate: Date | undefined;
  startTime?: string;
  endTime?: string;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  onStartTimeChange?: (time: string | undefined) => void;
  onEndTimeChange?: (time: string | undefined) => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function ReservationDatePicker({
  product,
  startDate,
  endDate,
  startTime,
  endTime,
  onStartDateChange,
  onEndDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onValidationChange,
}: ReservationDatePickerProps) {
  // Current month for fetching availability
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // Fetch availability for current month
  const { data: availabilityData, isLoading: isLoadingAvailability } =
    useProductAvailability(product.id, currentMonth, true);

  // Also fetch next month to have more data
  const nextMonth = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number);
    const nextDate = new Date(year, month, 1);
    return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
  }, [currentMonth]);

  const { data: nextMonthData } = useProductAvailability(
    product.id,
    nextMonth,
    true,
  );

  // Combine reserved dates from both months
  const reservedDates = useMemo(() => {
    const dates: string[] = [];
    if (availabilityData?.reservedDates) {
      dates.push(...availabilityData.reservedDates.map((r) => r.date));
    }
    if (nextMonthData?.reservedDates) {
      dates.push(...nextMonthData.reservedDates.map((r) => r.date));
    }
    return [...new Set(dates)];
  }, [availabilityData, nextMonthData]);

  // Combine closed dates from both months
  const closedDates = useMemo(() => {
    const dates: Array<{ date: string; reason: string }> = [];
    if (availabilityData?.closedDates) {
      dates.push(...availabilityData.closedDates);
    }
    if (nextMonthData?.closedDates) {
      dates.push(...nextMonthData.closedDates);
    }
    // Remove duplicates by date
    const uniqueDates = dates.reduce(
      (acc, curr) => {
        if (!acc.find((d) => d.date === curr.date)) {
          acc.push(curr);
        }
        return acc;
      },
      [] as Array<{ date: string; reason: string }>,
    );
    return uniqueDates;
  }, [availabilityData, nextMonthData]);

  // Get time slots from availability data
  const checkoutTimeSlots: TimeSlot[] = useMemo(() => {
    const slots = availabilityData?.timeSlots?.checkout || [];
    console.log("[DEBUG] checkoutTimeSlots from API:", slots);
    console.log("[DEBUG] availabilityData:", availabilityData);
    return slots;
  }, [availabilityData]);

  const returnTimeSlots: TimeSlot[] = useMemo(() => {
    const slots = availabilityData?.timeSlots?.return || [];
    console.log("[DEBUG] returnTimeSlots from API:", slots);
    return slots;
  }, [availabilityData]);

  // Check if time slots are defined for the section
  const hasCheckoutTimeSlots = checkoutTimeSlots.length > 0;
  const hasReturnTimeSlots = returnTimeSlots.length > 0;

  // Helper: Check if a date is in the allowed days array
  const isAllowedDay = (
    date: Date,
    allowedDays: number[] | undefined,
  ): boolean => {
    if (!allowedDays || allowedDays.length === 0) return true;
    const dayOfWeek = date.getDay();
    return allowedDays.some((day) => {
      const jsDay = day === 7 ? 0 : day;
      return dayOfWeek === jsDay;
    });
  };

  // Check if date is reserved
  const isDateReserved = (date: Date): boolean => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return reservedDates.includes(dateStr);
  };

  // Get allowed days names for display
  const getAllowedDaysNames = (days: number[] | undefined): string => {
    if (!days || days.length === 0) return "Tous les jours";
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    return days
      .map((day) => {
        const jsDay = day === 7 ? 0 : day;
        return dayNames[jsDay];
      })
      .join(", ");
  };

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validate start date
    if (startDate) {
      if (startDate < today) {
        errors.push("La date de sortie ne peut pas être dans le passé");
      }
      if (!isAllowedDay(startDate, product.section.allowedDaysOut)) {
        errors.push(
          `La date de sortie doit être un : ${getAllowedDaysNames(product.section.allowedDaysOut)}`,
        );
      }
      if (isDateReserved(startDate)) {
        errors.push("La date de sortie est déjà réservée");
      }
    }

    // Validate end date
    if (endDate) {
      if (!startDate) {
        errors.push("Veuillez sélectionner une date de sortie d'abord");
      } else {
        if (endDate <= startDate) {
          errors.push("La date de retour doit être après la date de sortie");
        }
        if (!isAllowedDay(endDate, product.section.allowedDaysIn)) {
          errors.push(
            `La date de retour doit être un : ${getAllowedDaysNames(product.section.allowedDaysIn)}`,
          );
        }

        // Check duration (inclusive: startDate to endDate)
        const durationDays =
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1;
        if (durationDays < product.minDuration) {
          errors.push(`La durée minimale est de ${product.minDuration} jours`);
        }
        // maxDuration = 0 means unlimited
        if (product.maxDuration > 0 && durationDays > product.maxDuration) {
          errors.push(`La durée maximale est de ${product.maxDuration} jours`);
        }

        // Check if any date in range is reserved
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
          if (isDateReserved(currentDate)) {
            errors.push(
              "Une ou plusieurs dates dans la période sont déjà réservées",
            );
            break;
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    // Validate start time if time slots are defined
    if (startDate && hasCheckoutTimeSlots && startTime) {
      const dayOfWeek = startDate.getDay();
      const slotsForDay = checkoutTimeSlots.filter(
        (s) => s.dayOfWeek === dayOfWeek,
      );
      if (slotsForDay.length > 0) {
        const isInSlot = slotsForDay.some(
          (s) => startTime >= s.startTime && startTime <= s.endTime,
        );
        if (!isInSlot) {
          errors.push("L'heure de retrait n'est pas dans un créneau autorisé");
        }
      }
    }

    // Validate end time if time slots are defined
    if (endDate && hasReturnTimeSlots && endTime) {
      const dayOfWeek = endDate.getDay();
      const slotsForDay = returnTimeSlots.filter(
        (s) => s.dayOfWeek === dayOfWeek,
      );
      if (slotsForDay.length > 0) {
        const isInSlot = slotsForDay.some(
          (s) => endTime >= s.startTime && endTime <= s.endTime,
        );
        if (!isInSlot) {
          errors.push("L'heure de retour n'est pas dans un créneau autorisé");
        }
      }
    }

    return errors;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    startDate,
    endDate,
    startTime,
    endTime,
    product,
    reservedDates,
    hasCheckoutTimeSlots,
    hasReturnTimeSlots,
    checkoutTimeSlots,
    returnTimeSlots,
  ]);

  // Calculate duration and cost (inclusive: startDate to endDate)
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return (
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      ) + 1
    );
  }, [startDate, endDate]);

  const totalCost = useMemo(() => {
    if (!duration || !product.priceCredits) return 0;
    if (product.creditPeriod === "WEEK") {
      const weeks = Math.ceil(duration / 7);
      return weeks * product.priceCredits;
    }
    return duration * product.priceCredits;
  }, [duration, product.priceCredits, product.creditPeriod]);

  // Check if form is valid
  const isValid = useMemo(() => {
    // Basic date validation
    if (!startDate || !endDate || validationErrors.length > 0) return false;

    // If time slots are defined, times must be provided and valid
    if (hasCheckoutTimeSlots && startDate) {
      const dayOfWeek = startDate.getDay();
      const slotsForDay = checkoutTimeSlots.filter(
        (s) => s.dayOfWeek === dayOfWeek,
      );
      // If there are slots for this day, time is required
      if (slotsForDay.length > 0 && !startTime) return false;
    }

    if (hasReturnTimeSlots && endDate) {
      const dayOfWeek = endDate.getDay();
      const slotsForDay = returnTimeSlots.filter(
        (s) => s.dayOfWeek === dayOfWeek,
      );
      // If there are slots for this day, time is required
      if (slotsForDay.length > 0 && !endTime) return false;
    }

    return true;
  }, [
    startDate,
    endDate,
    startTime,
    endTime,
    validationErrors,
    hasCheckoutTimeSlots,
    hasReturnTimeSlots,
    checkoutTimeSlots,
    returnTimeSlots,
  ]);

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isValid);
    }
  }, [isValid, onValidationChange]);

  // Handle month change in calendar
  const handleMonthChange = (year: number, month: number) => {
    setCurrentMonth(`${year}-${String(month).padStart(2, "0")}`);
  };

  // Format date for display
  const formatDate = (date: Date | undefined): string => {
    if (!date) return "-";
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="space-y-3">
      {/* Info Card */}
      <Card className="p-2.5">
        <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
          <div>
            <p className="text-muted-foreground">Sortie</p>
            <p className="font-medium">
              {getAllowedDaysNames(product.section.allowedDaysOut)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Retour</p>
            <p className="font-medium">
              {getAllowedDaysNames(product.section.allowedDaysIn)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Durée</p>
            <p className="font-medium">
              {product.minDuration}-
              {product.maxDuration === 0 ? "∞" : product.maxDuration}j
            </p>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card className="p-2.5">
        {isLoadingAvailability ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: 42 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <AvailabilityCalendar
            selectedStartDate={startDate}
            selectedEndDate={endDate}
            onStartDateSelect={onStartDateChange}
            onEndDateSelect={onEndDateChange}
            reservedDates={reservedDates}
            closedDates={closedDates}
            allowedDaysOut={product.section.allowedDaysOut}
            allowedDaysIn={product.section.allowedDaysIn}
            onMonthChange={handleMonthChange}
          />
        )}
      </Card>

      {/* Time Slot Pickers */}
      {(hasCheckoutTimeSlots || hasReturnTimeSlots) &&
        (startDate || endDate) && (
          <Card className="p-2.5">
            <div className="grid grid-cols-2 gap-4">
              {hasCheckoutTimeSlots && onStartTimeChange && (
                <TimeSlotPicker
                  slots={checkoutTimeSlots}
                  selectedDate={startDate}
                  selectedTime={startTime}
                  onTimeChange={onStartTimeChange}
                  label="Heure de retrait"
                />
              )}
              {hasReturnTimeSlots && onEndTimeChange && (
                <TimeSlotPicker
                  slots={returnTimeSlots}
                  selectedDate={endDate}
                  selectedTime={endTime}
                  onTimeChange={onEndTimeChange}
                  label="Heure de retour"
                />
              )}
            </div>
          </Card>
        )}

      {/* Selected dates display */}
      {(startDate || endDate) && (
        <div className="flex justify-between items-center px-1 text-xs">
          <div>
            <span className="text-muted-foreground">Sortie: </span>
            <span className="font-medium">
              {formatDate(startDate)}
              {startTime && ` à ${startTime}`}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Retour: </span>
            <span className="font-medium">
              {formatDate(endDate)}
              {endTime && ` à ${endTime}`}
            </span>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-3 w-3" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-0.5 text-[10px] sm:text-xs">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Success message */}
      {isValid && (
        <Alert className="border-green-200 bg-green-50 py-2">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <AlertDescription className="text-green-600 text-[10px] sm:text-xs">
            Dates valides
          </AlertDescription>
        </Alert>
      )}

      {/* Summary */}
      {startDate && endDate && duration > 0 && (
        <Card className="bg-primary/5 p-2.5">
          <div className="flex justify-between items-center">
            <div className="text-xs">
              <span className="text-muted-foreground">{duration}j</span>
              {product.priceCredits !== null && (
                <span className="text-muted-foreground">
                  {" "}
                  × {product.priceCredits} cr/
                  {product.creditPeriod === "WEEK" ? "sem" : "j"}
                </span>
              )}
            </div>
            {product.priceCredits !== null && (
              <div className="text-sm font-bold">{totalCost} crédits</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
