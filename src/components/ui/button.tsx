import { cn } from "@/lib/utils";
import { ArrowRightIcon, SpinnerIcon } from "@/components/ui/icons";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showArrow?: boolean;
};

const sizeClass = {
  sm: "h-9 rounded-[6px] px-4 text-[13px]",
  md: "h-11 rounded-[6px] px-5 text-[14px]",
  lg: "h-[46px] rounded-[8px] px-6 text-[15px]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading,
  leftIcon,
  rightIcon,
  showArrow,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        sizeClass[size],
        variant === "primary" &&
          "bg-[var(--brand)] text-white shadow-[0_10px_22px_rgba(37,150,190,0.22)] hover:bg-[var(--brand-deep)]",
        variant === "secondary" &&
          "border border-[var(--border)] bg-[var(--surface-muted)] text-[#344054] hover:bg-[#e7ecf2]",
        variant === "outline" &&
          "border border-[var(--border)] bg-white text-[var(--brand)] hover:border-[var(--brand-soft-2)] hover:bg-[#f4fbfd]",
        variant === "ghost" &&
          "bg-transparent text-[#667085] hover:bg-[#f3f5f8] hover:text-[#344054]",
        variant === "danger" && "bg-[#ff3b47] text-white hover:bg-[#e52e39]",
        className,
      )}
      {...props}
    >
      {loading ? <SpinnerIcon className="h-4 w-4 animate-spin" /> : leftIcon}
      {children}
      {rightIcon || (showArrow ? <ArrowRightIcon className="h-4 w-4" /> : null)}
    </button>
  );
}
