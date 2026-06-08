"use client";

import { forwardRef, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckIcon, EyeIcon, XIcon } from "@/components/ui/icons";

type FieldState = "default" | "focus" | "success" | "error";

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  hint?: string;
  error?: string;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  trailing?: React.ReactNode;
  containerClassName?: string;
  fieldClassName?: string;
  labelClassName?: string;
  fieldState?: FieldState;
  fieldSize?: "sm" | "md" | "lg";
  labelPlacement?: "outside" | "inside";
  clearable?: boolean;
  onClear?: () => void;
};

const fieldStateClass: Record<FieldState, string> = {
  default: "border-[#dfe3ea] bg-white",
  focus: "border-[#b47aea] bg-white shadow-[0_0_0_1px_rgba(180,122,234,0.35)]",
  success: "border-[#dfe3ea] bg-white",
  error: "border-[#f8b8c0] bg-[#fff4f5]",
};

const dashboardFieldStateClass: Record<FieldState, string> = {
  default:
    "border-[var(--border)] bg-white shadow-[inset_0_0_0_1px_rgba(216,226,236,0.95)]",
  focus:
    "border-[var(--brand-soft-2)] bg-white shadow-[inset_0_0_0_1px_rgba(37,150,190,0.18),0_0_0_1px_rgba(37,150,190,0.14)]",
  success:
    "border-[var(--border)] bg-white shadow-[inset_0_0_0_1px_rgba(216,226,236,0.95)]",
  error:
    "border-[#f8b8c0] bg-[#fff4f5] shadow-[inset_0_0_0_1px_rgba(248,184,192,0.9)]",
};

const fieldSizeClass = {
  sm: "h-10",
  md: "h-11",
  lg: "h-[46px]",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    success,
    leftIcon,
    rightIcon,
    trailing,
    className,
    containerClassName,
    fieldClassName,
    labelClassName,
    fieldState,
    fieldSize = "md",
    labelPlacement = "outside",
    clearable,
    onClear,
    disabled,
    id,
    type = "text",
    value,
    defaultValue,
    onChange,
    ...props
  },
  ref,
) {
  const pathname = usePathname();
  const isDashboardInput = pathname?.startsWith("/dashboard");
  const generatedId = useId();
  const inputId = id || generatedId;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const resolvedState: FieldState =
    fieldState || (error ? "error" : success ? "success" : "default");
  const hasValue =
    value !== undefined
      ? String(value).length > 0
      : defaultValue !== undefined && String(defaultValue).length > 0;

  const statusIcon = error ? (
    clearable ? (
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#9aa7b7] transition hover:bg-slate-100 hover:text-slate-700"
        aria-label="Clear field"
      >
        <XIcon className="h-4 w-4" />
      </button>
    ) : null
  ) : success ? (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#58b889] text-white">
      <CheckIcon className="h-4 w-4" />
    </span>
  ) : null;

  return (
    <label htmlFor={inputId} className={cn("block", containerClassName)}>
      {label && labelPlacement === "outside" ? (
        <span
          className={cn(
            "mb-3 block text-[14px] font-semibold leading-none tracking-[0.02em] text-[#202433]",
            labelClassName,
          )}
        >
          {label}
        </span>
      ) : null}

        <span
          className={cn(
            "flex w-full items-center gap-3 rounded-[8px] border px-4 transition",
            isDashboardInput
              ? "focus-within:border-[var(--brand-soft-2)] focus-within:shadow-[0_0_0_1px_rgba(37,150,190,0.14)]"
              : "focus-within:border-[#b47aea] focus-within:shadow-[0_0_0_1px_rgba(180,122,234,0.35)]",
          fieldSizeClass[fieldSize],
          (isDashboardInput ? dashboardFieldStateClass : fieldStateClass)[resolvedState],
          disabled &&
            "cursor-not-allowed border-[#d8e2ec] bg-[#eceef3] opacity-100 shadow-[inset_0_0_0_1px_rgba(216,226,236,0.95)]",
          fieldClassName,
        )}
      >
        {leftIcon ? (
          <span className="shrink-0 text-[#a4a4ad]">{leftIcon}</span>
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
          <input
            ref={ref}
            id={inputId}
            type={isPassword && isPasswordVisible ? "text" : type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "h-5 w-full min-w-0 bg-transparent text-[14px] font-medium text-[#252838] outline-none placeholder:text-[#98a2b3] disabled:cursor-not-allowed disabled:text-[#a4a4ad]",
              labelPlacement === "inside" && "mt-1",
              error && "text-[#d33a44] placeholder:text-[#d33a44]",
              className,
            )}
            {...props}
          />
        </span>
        {trailing ? <span className="shrink-0">{trailing}</span> : null}
        {statusIcon}
        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((current) => !current)}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#a4a4ad] transition hover:bg-slate-100 hover:text-[#667085]"
            aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        ) : rightIcon ? (
          <span className="shrink-0 text-[#a4a4ad]">{rightIcon}</span>
        ) : clearable && hasValue ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#9aa7b7] transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Clear field"
          >
            <XIcon className="h-4 w-4" />
          </button>
        ) : null}
      </span>

      {error ? (
        <span className="mt-2 block text-[13px] font-medium text-[#d33a44]">
          {error}
        </span>
      ) : hint ? (
        <span className="mt-2 block text-[13px] font-medium text-[#a4a4ad]">
          {hint}
        </span>
      ) : null}
    </label>
  );
});
