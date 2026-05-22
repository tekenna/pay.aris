"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CalendarIcon, CheckIcon, ChevronDown, FilterIcon } from "@/components/ui/icons";
import { DateRange } from "@/components/ui/DateRange";
import { Datepicker } from "@/components/ui/Datepicker";

export type FilterValue = { label?: string; value?: string } | string;

export interface FilterItem {
  title: string;
  type: "date-range" | "date" | "checkbox";
  selectionMode?: "single" | "multiple";
  values?: FilterValue[];
  selected?: string[];
}

interface FilterProps {
  filterItems: FilterItem[];
  onChange?: (items: FilterItem[]) => void;
}

const triggerClasses =
  "inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-[color:rgba(0,83,48,0.24)] hover:bg-[var(--surface-subtle)]";

const pad = (value: number) => String(value).padStart(2, "0");

const formatDateKey = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

export function Filter({ filterItems, onChange }: FilterProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [items, setItems] = useState<FilterItem[]>(filterItems);

  useEffect(() => {
    setItems(filterItems);
  }, [filterItems]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeFilterCount = useMemo(
    () =>
      items.reduce((count, item) => {
        if (item.type === "checkbox") return count + (item.selected?.length ?? 0);
        if ((item.type === "date-range" || item.type === "date") && item.selected?.length) {
          return count + 1;
        }
        return count;
      }, 0),
    [items],
  );

  const updateItems = (nextItems: FilterItem[]) => {
    setItems(nextItems);
    onChange?.(nextItems);
  };

  const updateCheckbox = (index: number, value: string) => {
    const nextItems = [...items];
    const currentItem = nextItems[index];
    const selected = new Set(currentItem.selected ?? []);

    if (currentItem.selectionMode === "single") {
      if (selected.has(value)) {
        selected.clear();
      } else {
        selected.clear();
        selected.add(value);
      }
    } else {
      if (selected.has(value)) {
        selected.delete(value);
      } else {
        selected.add(value);
      }
    }

    nextItems[index] = { ...currentItem, selected: Array.from(selected) };
    updateItems(nextItems);
  };

  const handleDateRangeSelect = (index: number, range: { fromDate: string; toDate: string }) => {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], selected: [range.fromDate, range.toDate] };
    updateItems(nextItems);
  };

  const handleDateSelect = (index: number, value: Date | null) => {
    const nextItems = [...items];
    nextItems[index] = {
      ...nextItems[index],
      selected: value ? [formatDateKey(value)] : [],
    };
    updateItems(nextItems);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-fit">
      <button type="button" onClick={() => setOpen((value) => !value)} className={triggerClasses}>
        <FilterIcon className="h-4 w-4 text-[var(--brand)]" />
        <span>Filter</span>
        {activeFilterCount > 0 ? (
          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[color:rgba(0,83,48,0.1)] px-2 py-0.5 text-xs font-semibold text-[var(--brand)]">
            {activeFilterCount}
          </span>
        ) : null}
        <ChevronDown
          className={`h-4 w-4 text-[#98a2b3] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[320px] rounded-2xl border border-[var(--border)] bg-white p-3 shadow-[0_24px_60px_rgba(16,24,40,0.14)]">
          {items.map((item, index) => {
            const isActive = activeIndex === index;

            return (
              <div
                key={`${item.title}-${index}`}
                className="border-b border-[var(--border)] py-2 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => setActiveIndex((current) => (current === index ? null : index))}
                  className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left transition hover:bg-[var(--surface-subtle)]"
                >
                  <div className="flex items-center gap-2">
                    {(item.type === "date" || item.type === "date-range") ? (
                      <CalendarIcon className="h-4 w-4 text-[var(--brand)]" />
                    ) : null}
                    <span className="text-sm font-semibold text-[var(--foreground)]">{item.title}</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-[#98a2b3] transition ${isActive ? "rotate-180" : ""}`}
                  />
                </button>

                {isActive ? (
                  <div className="px-2 pb-2 pt-3">
                    {item.type === "checkbox" ? (
                      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                        {(item.values ?? []).map((option) => {
                          const value =
                            typeof option === "string"
                              ? option
                              : option.value || option.label || "";
                          const label =
                            typeof option === "string" ? option : option.label || option.value || "";
                          const selected = item.selected?.includes(value) ?? false;

                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => updateCheckbox(index, value)}
                              className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-[var(--surface-subtle)] px-3 py-2 text-left transition hover:border-[color:rgba(0,83,48,0.18)] hover:bg-white"
                            >
                              <span
                                className={`inline-flex h-5 w-5 items-center justify-center rounded-md border ${
                                  selected
                                    ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                                    : "border-[var(--border)] bg-white text-transparent"
                                }`}
                              >
                                <CheckIcon className="h-3.5 w-3.5" />
                              </span>
                              <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}

                    {item.type === "date-range" ? (
                      <DateRange
                        fromDate={item.selected?.[0] ?? null}
                        toDate={item.selected?.[1] ?? null}
                        onSelect={(range) => handleDateRangeSelect(index, range)}
                      />
                    ) : null}

                    {item.type === "date" ? (
                      <Datepicker
                        placeholder="Select date"
                        position="bottom"
                        selectedDate={item.selected?.[0] ?? null}
                        onChange={(value) => handleDateSelect(index, value)}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
