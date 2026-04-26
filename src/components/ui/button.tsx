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
  sm: "h-9 rounded-[8px] px-4 text-[13px]",
  md: "h-10 rounded-[8px] px-5 text-[14px]",
  lg: "h-[45px] rounded-[8px] px-7 text-[15px]",
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
        "inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        sizeClass[size],
        variant === "primary" && "bg-[#0a9550] text-white hover:bg-[#087d44]",
        variant === "secondary" &&
          "border border-transparent bg-[#f3f5f8] text-[#344054] hover:bg-[#e9eef4]",
        variant === "outline" &&
          "border border-[#51ad82] bg-white text-[#006d3b] hover:bg-[#effaf4]",
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
