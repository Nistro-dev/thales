import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Sélectionner...",
  emptyMessage = "Aucune option disponible",
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = selected
    .map((value) => options.find((opt) => opt.value === value)?.label)
    .filter(Boolean);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            selected.length === 0 && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selected.length === 0 ? (
              placeholder
            ) : selected.length <= 2 ? (
              selectedLabels.map((label, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="mr-1 mb-1 px-2 py-0"
                >
                  {label}
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onClick={(e) => handleRemove(selected[i], e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span>{selected.length} sélectionnées</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <div className="max-h-60 overflow-auto p-2">
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              {emptyMessage}
            </p>
          ) : (
            <div className="space-y-1">
              {options.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    selected.includes(option.value) && "bg-accent",
                  )}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                  />
                  <span className="flex-1">{option.label}</span>
                  {selected.includes(option.value) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </label>
              ))}
            </div>
          )}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => onChange([])}
            >
              Tout désélectionner
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
