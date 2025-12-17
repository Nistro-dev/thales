import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClosedDate {
  date: string;
  reason: string;
}

interface AvailabilityCalendarProps {
  selectedStartDate: Date | undefined;
  selectedEndDate: Date | undefined;
  onStartDateSelect: (date: Date) => void;
  onEndDateSelect: (date: Date) => void;
  reservedDates: string[];
  closedDates?: ClosedDate[];
  allowedDaysOut?: number[];
  allowedDaysIn?: number[];
  minDate?: Date;
  onMonthChange?: (year: number, month: number) => void;
}

export function AvailabilityCalendar({
  selectedStartDate,
  selectedEndDate,
  onStartDateSelect,
  onEndDateSelect,
  reservedDates,
  closedDates = [],
  allowedDaysOut,
  allowedDaysIn,
  minDate,
  onMonthChange,
}: AvailabilityCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const [selectingStartDate, setSelectingStartDate] = useState(true);

  // Day names in French (starting Monday)
  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Month names in French
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  // Convert backend day format (1=Monday, 7=Sunday) to JS format (0=Sunday, 1=Monday)
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

  // Check if date is closed (section closure)
  const isDateClosed = (date: Date): boolean => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return closedDates.some((c) => c.date === dateStr);
  };

  // Get closure reason for a date
  const getClosureReason = (date: Date): string | undefined => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return closedDates.find((c) => c.date === dateStr)?.reason;
  };

  // Check if date is in the selected range
  const isInRange = (date: Date): boolean => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  // Check if date is the start or end of selection
  const isStartDate = (date: Date): boolean => {
    if (!selectedStartDate) return false;
    return date.toDateString() === selectedStartDate.toDateString();
  };

  const isEndDate = (date: Date): boolean => {
    if (!selectedEndDate) return false;
    return date.toDateString() === selectedEndDate.toDateString();
  };

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0=Sunday, adjust to start on Monday)
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Add days from previous month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({ date, isCurrentMonth: true });
    }

    // Add days from next month to complete the grid (6 rows)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month === 0 ? 11 : prev.month - 1;
      const newYear = prev.month === 0 ? prev.year - 1 : prev.year;
      onMonthChange?.(newYear, newMonth + 1);
      return { year: newYear, month: newMonth };
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = prev.month === 11 ? 0 : prev.month + 1;
      const newYear = prev.month === 11 ? prev.year + 1 : prev.year;
      onMonthChange?.(newYear, newMonth + 1);
      return { year: newYear, month: newMonth };
    });
  };

  // Handle date click
  const handleDateClick = (date: Date) => {
    if (selectingStartDate) {
      // Check if valid start date
      if (!isAllowedDay(date, allowedDaysOut)) return;
      if (isDateReserved(date)) return;
      if (minDate && date < minDate) return;
      if (date < today) return;

      onStartDateSelect(date);
      setSelectingStartDate(false);
    } else {
      // Check if valid end date
      if (!isAllowedDay(date, allowedDaysIn)) return;
      if (isDateReserved(date)) return;
      if (selectedStartDate && date <= selectedStartDate) return;

      // Check if any date in range is reserved
      if (selectedStartDate) {
        const currentDate = new Date(selectedStartDate);
        while (currentDate <= date) {
          if (isDateReserved(currentDate)) return;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      onEndDateSelect(date);
      setSelectingStartDate(true);
    }
  };

  // Get date state for styling
  const getDateState = (date: Date, isCurrentMonth: boolean) => {
    const isPast = date < today;
    const isReserved = isDateReserved(date);
    const isClosed = isDateClosed(date);
    const isStart = isStartDate(date);
    const isEnd = isEndDate(date);
    const inRange = isInRange(date);

    // Determine if date is selectable based on current selection mode
    let isDisabled = !isCurrentMonth || isPast || isReserved || isClosed;

    if (selectingStartDate) {
      // For start date selection, check allowed days out
      if (!isAllowedDay(date, allowedDaysOut)) isDisabled = true;
    } else {
      // For end date selection, check allowed days in and must be after start
      if (!isAllowedDay(date, allowedDaysIn)) isDisabled = true;
      if (selectedStartDate && date <= selectedStartDate) isDisabled = true;
    }

    return {
      isPast,
      isReserved,
      isClosed,
      isStart,
      isEnd,
      inRange,
      isDisabled,
    };
  };

  // Can go to previous month?
  const canGoPrevious = useMemo(() => {
    return (
      currentMonth.year > today.getFullYear() ||
      (currentMonth.year === today.getFullYear() &&
        currentMonth.month > today.getMonth())
    );
  }, [currentMonth, today]);

  const handleReset = () => {
    onStartDateSelect(undefined as unknown as Date);
    onEndDateSelect(undefined as unknown as Date);
    setSelectingStartDate(true);
  };

  return (
    <div className="space-y-3">
      {/* Selection mode indicator with reset button */}
      <div className="flex items-center justify-center gap-2 text-sm">
        {selectingStartDate ? (
          <span className="text-primary font-medium">
            Sélectionnez la date de sortie
          </span>
        ) : (
          <span className="text-primary font-medium">
            Sélectionnez la date de retour
          </span>
        )}
        {(selectedStartDate || selectedEndDate) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            title="Réinitialiser"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          disabled={!canGoPrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-sm">
          {monthNames[currentMonth.month]} {currentMonth.year}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const {
            isPast,
            isReserved,
            isClosed,
            isStart,
            isEnd,
            inRange,
            isDisabled,
          } = getDateState(date, isCurrentMonth);
          const closureReason = isClosed ? getClosureReason(date) : undefined;

          return (
            <button
              key={index}
              type="button"
              onClick={() => !isDisabled && handleDateClick(date)}
              disabled={isDisabled}
              title={closureReason ? `Fermé: ${closureReason}` : undefined}
              className={cn(
                "h-8 w-full text-xs rounded-md transition-colors relative",
                // Base states
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !isDisabled && "hover:bg-accent",
                // Disabled states
                isDisabled && "cursor-not-allowed opacity-50",
                isPast && isCurrentMonth && "text-muted-foreground/50",
                isReserved &&
                  isCurrentMonth &&
                  "bg-destructive/20 text-destructive line-through",
                // Closed states (different from reserved)
                isClosed &&
                  isCurrentMonth &&
                  "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                // Selected states
                isStart &&
                  "bg-primary text-primary-foreground hover:bg-primary",
                isEnd && "bg-primary text-primary-foreground hover:bg-primary",
                inRange && !isStart && !isEnd && "bg-primary/20",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary" />
          <span>Sélectionné</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-primary/20" />
          <span>Plage</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-destructive/20" />
          <span>Réservé</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-orange-100 dark:bg-orange-900/30" />
          <span>Fermé</span>
        </div>
      </div>
    </div>
  );
}
