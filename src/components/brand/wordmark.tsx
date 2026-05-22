import Image from "next/image";
import { cn } from "@/lib/utils";

export function Wordmark({
  inverted = false,
  compact = false,
}: {
  inverted?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/images/white-logo.svg"
        alt="Aris Wallex"
        width={251}
        height={53}
        loading="eager"
        className={cn(
          compact ? "h-9 w-9 object-contain object-left" : "h-[34px] w-[162px] object-contain object-left",
          !inverted && "logo-on-light",
        )}
      />
      {!compact ? (
        <div className="sr-only">
          <p className={cn("text-sm font-semibold", inverted ? "text-white" : "text-slate-900")}>
            Aris Wallex
          </p>
          <p className={cn("text-xs", inverted ? "text-white/65" : "text-slate-500")}>
            Pay Business Suite
          </p>
        </div>
      ) : null}
    </div>
  );
}
