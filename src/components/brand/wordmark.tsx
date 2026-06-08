import Image from "next/image";

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
        src="/images/logo.svg"
        alt="Aris Pay"
        width={990}
        height={204}
        loading="eager"
        className={compact ? "h-6 w-[116px] object-contain object-left" : "h-[34px] w-[162px] object-contain object-left"}
      />
      {!compact ? (
        <div className="sr-only">
          <p className={inverted ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-900"}>
            Aris Pay
          </p>
          <p className={inverted ? "text-xs text-white/65" : "text-xs text-slate-500"}>
            Pay Business Suite
          </p>
        </div>
      ) : null}
    </div>
  );
}
