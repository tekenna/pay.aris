import { cn } from "@/lib/utils";

export function AuthLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn("auth-logo-mask h-[38px] w-[192px]", className)}
      aria-label="Aris"
    />
  );
}
