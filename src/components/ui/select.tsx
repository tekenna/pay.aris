"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDown } from "@/components/ui/icons";

export type SelectOption = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[] | string[];
  containerClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  fieldSize?: "sm" | "md" | "lg";
  labelPlacement?: "outside" | "inside";
  leftIcon?: React.ReactNode;
  placeholder?: string;
};

function normalizeOptions(options: SelectProps["options"]): SelectOption[] {
  return options.map((option) =>
    typeof option === "string" ? { label: option, value: option } : option,
  );
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    hint,
    error,
    options,
    containerClassName,
    fieldClassName,
    labelClassName,
    fieldSize = "md",
    labelPlacement = "outside",
    leftIcon,
    placeholder,
    disabled,
    id,
    className,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const normalizedOptions = normalizeOptions(options);

  return (
    <label htmlFor={selectId} className={cn("block", containerClassName)}>
      {label && labelPlacement === "outside" ? (
        <span
          className={cn(
            "mb-2 block text-[14px] font-semibold leading-none tracking-[0.02em] text-[#667085]",
            labelClassName,
          )}
        >
          {label}
        </span>
      ) : null}

        <span
          className={cn(
          "flex w-full items-center gap-3 rounded-[8px] border border-[var(--border)] bg-white px-4 shadow-[inset_0_0_0_1px_rgba(216,226,236,0.95)] transition focus-within:border-[var(--brand-soft-2)] focus-within:bg-white focus-within:shadow-[inset_0_0_0_1px_rgba(10,146,81,0.18),0_0_0_1px_rgba(10,146,81,0.14)]",
          fieldSize === "sm" && "h-10",
          fieldSize === "md" && "h-11",
          fieldSize === "lg" && "h-[46px]",
          error &&
            "border-[#ff3b47] bg-white shadow-[inset_0_0_0_1px_rgba(255,59,71,0.35)]",
          disabled &&
            "cursor-not-allowed border-[#d8e2ec] bg-[#eceef3] opacity-70 shadow-[inset_0_0_0_1px_rgba(216,226,236,0.95)]",
          fieldClassName,
        )}
      >
        {leftIcon ? (
          <span className="shrink-0 text-[#98a2b3]">{leftIcon}</span>
        ) : null}
        <span className="min-w-0 flex-1">
          {label && labelPlacement === "inside" ? (
            <span
              className={cn(
                "block text-[12px] font-medium leading-[1.15] text-[#98a2b3]",
                labelClassName,
              )}
            >
              {label}
            </span>
          ) : null}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-5 w-full appearance-none bg-transparent text-[14px] font-medium text-[#344054] outline-none disabled:cursor-not-allowed disabled:text-[#667085]",
              labelPlacement === "inside" && "mt-1",
              className,
            )}
            {...props}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {normalizedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#98a2b3]" />
      </span>

      {error ? (
        <span className="mt-2 block text-[13px] font-medium text-[#ff2635]">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-2 block text-[13px] font-medium text-[#98a2b3]">
          {hint}
        </span>
      ) : null}
    </label>
  );
});

type DropdownProps = {
  label?: string;
  value?: string;
  placeholder?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function DropdownPreview({
  label,
  value,
  placeholder = "Select option",
  options,
  onChange,
  className,
  searchable,
  searchPlaceholder = "Search",
}: DropdownProps) {
  return (
    <div className={cn("rounded-[8px] border border-[var(--border)] bg-white shadow-[var(--shadow-soft)]", className)}>
      <button
        type="button"
        className="flex h-11 w-full items-center justify-between gap-3 rounded-t-[8px] bg-[var(--surface-muted)] px-4 text-left text-[14px] font-medium text-[#667085]"
      >
        <span>
          {label ? (
            <span className="block text-[12px] leading-none text-[#98a2b3]">
              {label}
            </span>
          ) : null}
          <span className={cn(label && "mt-1 block", value && "text-[#344054]")}>
            {options.find((option) => option.value === value)?.label || placeholder}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-[#98a2b3]" />
      </button>
      {searchable ? (
        <div className="border-b border-[#edf1f5] px-4 py-3 text-[14px] text-[#667085]">
          {searchPlaceholder}
        </div>
      ) : null}
      <div className="max-h-[260px] overflow-auto p-2">
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange?.(option.value)}
              className={cn(
                "flex min-h-[42px] w-full items-center gap-3 rounded-[6px] px-3 text-left text-[15px] font-medium text-[#667085] transition hover:bg-[#f5faf7]",
                selected && "bg-[#eef9f1] text-[var(--brand)]",
              )}
            >
              {option.icon ? <span className="shrink-0">{option.icon}</span> : null}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
              {selected ? <CheckIcon className="h-4 w-4 shrink-0" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
