"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
}

const PRESETS = [
  { label: "최근 7일", days: 7 },
  { label: "최근 30일", days: 30 },
  { label: "최근 90일", days: 90 },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>(value);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onChange(range);
  };

  const handlePreset = (days: number) => {
    const range: DateRange = {
      from: subDays(new Date(), days),
      to: new Date(),
    };
    setDate(range);
    onChange(range);
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "yyyy년 MM월 dd일", { locale: ko })} -{" "}
                  {format(date.to, "yyyy년 MM월 dd일", { locale: ko })}
                </>
              ) : (
                format(date.from, "yyyy년 MM월 dd일", { locale: ko })
              )
            ) : (
              <span>날짜 범위 선택</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ko}
          />
        </PopoverContent>
      </Popover>

      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset.days}
            variant="outline"
            size="sm"
            onClick={() => handlePreset(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
