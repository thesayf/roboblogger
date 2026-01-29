"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value?: string; // ISO string or datetime-local format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse the value into a Date object
  const dateValue = React.useMemo(() => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }, [value]);

  // Extract hours and minutes
  const hours = dateValue ? dateValue.getHours().toString().padStart(2, "0") : "12";
  const minutes = dateValue ? dateValue.getMinutes().toString().padStart(2, "0") : "00";

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Preserve the current time or use default
    const newDate = new Date(date);
    newDate.setHours(parseInt(hours));
    newDate.setMinutes(parseInt(minutes));

    // Format as datetime-local compatible string
    const formatted = formatToDateTimeLocal(newDate);
    onChange(formatted);
  };

  // Handle time change
  const handleTimeChange = (newHours: string, newMinutes: string) => {
    const baseDate = dateValue || new Date();
    const newDate = new Date(baseDate);
    newDate.setHours(parseInt(newHours));
    newDate.setMinutes(parseInt(newMinutes));

    const formatted = formatToDateTimeLocal(newDate);
    onChange(formatted);
  };

  // Format date to datetime-local format (YYYY-MM-DDTHH:MM)
  const formatToDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Format for display
  const displayValue = dateValue
    ? format(dateValue, "d MMM yyyy, HH:mm")
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10 bg-white border-[#E0DED8] hover:bg-[#FAFAF8] hover:border-[#CCCCCC]",
            !dateValue && "text-[#888888]",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#888888]" />
          <span className="text-[14px]">{displayValue}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white border-[#E0DED8] shadow-lg" align="start">
        <div className="p-3 border-b border-[#F0EEE8]">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            initialFocus
            className="rounded-md"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-[14px] font-medium text-[#111111]",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-[#E0DED8] rounded-md hover:bg-[#F5F4F0]",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-[#888888] rounded-md w-9 font-normal text-[12px]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-[13px] p-0 relative focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-[#F5F4F0] transition-colors",
              day_selected: "bg-[#111111] text-white hover:bg-[#333333] hover:text-white focus:bg-[#111111] focus:text-white",
              day_today: "bg-[#F5F4F0] text-[#111111] font-medium",
              day_outside: "text-[#CCCCCC] opacity-50",
              day_disabled: "text-[#CCCCCC] opacity-50",
              day_hidden: "invisible",
            }}
          />
        </div>

        {/* Time Picker */}
        <div className="p-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#888888]" />
          <span className="text-[13px] text-[#666666]">Time:</span>
          <div className="flex items-center gap-1 ml-auto">
            <select
              value={hours}
              onChange={(e) => handleTimeChange(e.target.value, minutes)}
              className="h-8 w-14 rounded-md border border-[#E0DED8] bg-white text-[14px] text-center focus:border-[#111111] focus:outline-none"
            >
              {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")).map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span className="text-[#888888] font-medium">:</span>
            <select
              value={minutes}
              onChange={(e) => handleTimeChange(hours, e.target.value)}
              className="h-8 w-14 rounded-md border border-[#E0DED8] bg-white text-[14px] text-center focus:border-[#111111] focus:outline-none"
            >
              {["00", "15", "30", "45"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 pt-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[12px] h-8 border-[#E0DED8] hover:bg-[#F5F4F0]"
            onClick={() => {
              const now = new Date();
              onChange(formatToDateTimeLocal(now));
            }}
          >
            Now
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-[12px] h-8 border-[#E0DED8] hover:bg-[#F5F4F0]"
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              tomorrow.setHours(9, 0, 0, 0);
              onChange(formatToDateTimeLocal(tomorrow));
            }}
          >
            Tomorrow 9am
          </Button>
          <Button
            size="sm"
            className="flex-1 text-[12px] h-8 bg-[#111111] hover:bg-[#333333]"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
