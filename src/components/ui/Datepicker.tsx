"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarIcon, ChevronDown, ChevronLeft } from "@/components/ui/icons";

interface DatepickerProps {
  placeholder?: string;
  label?: string;
  selectedDate?: Date | string | null;
  disabled?: boolean;
  max?: string;
  error?: string;
  position?: "top" | "bottom";
  onChange?: (value: Date | null) => void;
}

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const panelClasses =
  "absolute right-0 z-50 w-[320px] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_24px_60px_rgba(16,24,40,0.14)]";

const inputClasses =
  "flex h-12 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-white px-4 text-sm shadow-sm transition hover:border-[color:rgba(37,150,190,0.22)]";

const parseDateString = (value: string) => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!matched) return null;

  const [, yearText, monthText, dayText] = matched;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDate = (value?: Date | string | null) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const parsed = parseDateString(value) ?? new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const sameDay = (left: Date | null, right: Date | null) =>
  Boolean(
    left &&
      right &&
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate(),
  );

const formatDisplayDate = (value: Date | null) =>
  value
    ? value.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const isAfterMax = (date: Date, max?: string) => {
  if (!max) return false;
  const maxDate = new Date(max);
  return Number.isNaN(maxDate.getTime()) ? false : date > maxDate;
};

export function Datepicker({
  placeholder = "Select date",
  label,
  selectedDate = null,
  disabled = false,
  max,
  error,
  position = "top",
  onChange,
}: DatepickerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedValue = useMemo(() => toDate(selectedDate), [selectedDate]);
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(selectedValue);
  const [viewDate, setViewDate] = useState<Date>(selectedValue || new Date());

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setTempDate(selectedValue);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selectedValue]);

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7;
    const cells = Array(42).fill(null) as Array<Date | null>;

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells[startOffset + day - 1] = new Date(year, month, day);
    }

    return cells;
  }, [viewDate]);

  const displayValue = formatDisplayDate(selectedValue);

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label ? <p className="mb-2 text-sm font-semibold text-[#475467]">{label}</p> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() =>
          setOpen((value) => {
            if (!value) {
              setTempDate(selectedValue);
              if (selectedValue) {
                setViewDate(selectedValue);
              }
            }
            return !value;
          })
        }
        className={`${inputClasses} ${disabled ? "cursor-not-allowed opacity-70" : ""} ${
          error ? "border-[#f04438]" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <CalendarIcon className="h-4 w-4 text-[var(--brand)]" />
          <span className={displayValue ? "font-medium text-[var(--foreground)]" : "text-[#98a2b3]"}>
            {displayValue || placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-[#98a2b3] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className={`${panelClasses} ${position === "top" ? "bottom-14" : "top-14"}`}>
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[#667085] transition hover:bg-[color:rgba(37,150,190,0.08)] hover:text-[var(--brand)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() =>
                setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[#667085] transition hover:bg-[color:rgba(37,150,190,0.08)] hover:text-[var(--brand)]"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {calendarCells.map((date, index) => {
              if (!date) {
                return <span key={`empty-${index}`} className="h-10 rounded-xl bg-transparent" />;
              }

              const isDisabled = isAfterMax(date, max);
              const selected = sameDay(tempDate, date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setTempDate(date)}
                  className={`h-10 rounded-xl text-sm font-medium transition ${
                    selected
                      ? "bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(37,150,190,0.24)]"
                      : "bg-[var(--surface-subtle)] text-[var(--foreground)] hover:bg-[color:rgba(37,150,190,0.08)]"
                  } ${isDisabled ? "cursor-not-allowed opacity-40" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setTempDate(selectedValue);
                setOpen(false);
              }}
              className="h-10 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[#667085] transition hover:bg-[var(--surface-subtle)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onChange?.(tempDate);
              }}
              className="h-10 rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(37,150,190,0.24)] transition hover:opacity-95"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
