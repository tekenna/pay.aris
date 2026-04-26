import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-[var(--border)] ",
        className || "bg-[var(--surface)] shadow-[var(--shadow-card)]",
      )}
    >
      {children}
    </div>
  );
}
