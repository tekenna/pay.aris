"use client";

import { cn } from "@/lib/utils";

export type SegmentItem = {
  label: string;
  value: string;
};

export function SegmentedControl({
  value,
  onChange,
  items,
  className,
  size = "md",
}: {
  value: string;
  onChange: (value: string) => void;
  items: SegmentItem[];
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "inline-grid rounded-[8px] bg-transparent p-0",
        size === "sm" ? "gap-2" : "gap-2",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const selected = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "rounded-[6px] text-center font-semibold transition",
              size === "sm" ? "px-4 py-2 text-[12px]" : "px-4 py-2.5 text-[13px]",
              selected
                ? "bg-[#e3f4ec] text-[#007a3d]"
                : "text-[#667085] hover:bg-white/70 hover:text-[#344054]",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
