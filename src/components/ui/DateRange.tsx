"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarIcon, ChevronDown, ChevronLeft } from "@/components/ui/icons";

interface DateRangeProps {
  fromDate?: string | null;
  toDate?: string | null;
  onSelect?: (range: { fromDate: string; toDate: string }) => void;
  error?: string;
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

const parseDateString = (value: string) => {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!matched) return null;

  const [, yearText, monthText, dayText] = matched;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseDate = (value?: string | null) => {
  if (!value) return null;
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

const formatInputDate = (value: Date | null) =>
  value
    ? value.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Select";

const pad = (value: number) => String(value).padStart(2, "0");

const toKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export function DateRange({
  fromDate,
  toDate,
  onSelect,
  error,
}: DateRangeProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selectedFrom = useMemo(() => parseDate(fromDate), [fromDate]);
  const selectedTo = useMemo(() => parseDate(toDate), [toDate]);
  const [open, setOpen] = useState(false);
  const [tempFrom, setTempFrom] = useState<Date | null>(selectedFrom);
  const [tempTo, setTempTo] = useState<Date | null>(selectedTo);
  const [viewDate, setViewDate] = useState<Date>(
    selectedFrom || selectedTo || new Date(),
  );

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setTempFrom(selectedFrom);
        setTempTo(selectedTo);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selectedFrom, selectedTo]);

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

  const start =
    tempFrom && tempTo ? (tempFrom < tempTo ? tempFrom : tempTo) : tempFrom;
  const end =
    tempFrom && tempTo ? (tempFrom > tempTo ? tempFrom : tempTo) : tempTo;

  const selectDate = (date: Date) => {
    if (!tempFrom || (tempFrom && tempTo)) {
      setTempFrom(date);
      setTempTo(null);
      return;
    }

    if (date < tempFrom) {
      setTempTo(tempFrom);
      setTempFrom(date);
      return;
    }

    setTempTo(date);
  };

  const inRange = (date: Date) => {
    if (!start || !end) return false;
    return date >= start && date <= end;
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <button
        type="button"
        onClick={() =>
          setOpen((value) => {
            if (!value) {
              setTempFrom(selectedFrom);
              setTempTo(selectedTo);
              const nextViewDate = selectedFrom || selectedTo;
              if (nextViewDate) {
                setViewDate(nextViewDate);
              }
            }
            return !value;
          })
        }
        className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm shadow-sm transition hover:border-[color:rgba(0,83,48,0.22)] ${
          error ? "border-[#f04438]" : "border-[var(--border)]"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <CalendarIcon className="h-4 w-4 text-[var(--brand)]" />
          <span className="font-medium text-[var(--foreground)]">
            {formatInputDate(selectedFrom)} - {formatInputDate(selectedTo)}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-[#98a2b3] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-[340px] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_24px_60px_rgba(16,24,40,0.14)]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() - 1, 1),
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[#667085] transition hover:bg-[color:rgba(0,83,48,0.08)] hover:text-[var(--brand)]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() =>
                setViewDate(
                  (current) =>
                    new Date(current.getFullYear(), current.getMonth() + 1, 1),
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-subtle)] text-[#667085] transition hover:bg-[color:rgba(0,83,48,0.08)] hover:text-[var(--brand)]"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>

          <div className="mb-4 rounded-2xl bg-[var(--surface-subtle)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
              Selected Range
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {formatInputDate(tempFrom)} - {formatInputDate(tempTo)}
            </p>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-7 gap-2">
            {calendarCells.map((date, index) => {
              if (!date) {
                return (
                  <span
                    key={`empty-${index}`}
                    className="h-10 rounded-xl bg-transparent"
                  />
                );
              }

              const selected = sameDay(tempFrom, date) || sameDay(tempTo, date);
              const highlighted = inRange(date);

              return (
                <button
                  key={toKey(date)}
                  type="button"
                  onClick={() => selectDate(date)}
                  className={`h-10 rounded-xl text-sm font-medium transition ${
                    selected
                      ? "bg-[var(--brand)] text-white shadow-[0_10px_24px_rgba(0,83,48,0.24)]"
                      : highlighted
                        ? "bg-[color:rgba(0,83,48,0.10)] text-[var(--brand)]"
                        : "bg-[var(--surface-subtle)] text-[var(--foreground)] hover:bg-[color:rgba(0,83,48,0.08)]"
                  }`}
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
                setTempFrom(selectedFrom);
                setTempTo(selectedTo);
                setOpen(false);
              }}
              className="h-10 rounded-xl border border-[var(--border)] px-4 text-sm font-semibold text-[#667085] transition hover:bg-[var(--surface-subtle)]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!tempFrom || !tempTo}
              onClick={() => {
                if (!tempFrom || !tempTo) return;
                setOpen(false);
                onSelect?.({
                  fromDate: toKey(tempFrom),
                  toDate: toKey(tempTo),
                });
              }}
              className="h-10 rounded-xl bg-[var(--brand)] px-4 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(0,83,48,0.24)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
