import { cn } from "@/lib/utils";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const normalized = String(value || "unknown").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-[6px] px-3 py-1 text-xs font-semibold capitalize",
        normalized.includes("success") ||
          normalized.includes("active") ||
          normalized.includes("completed") ||
          normalized === "ok"
          ? "bg-emerald-50 text-emerald-700"
          : normalized.includes("pending")
            ? "bg-amber-50 text-amber-700"
            : normalized.includes("failed") || normalized.includes("rejected")
              ? "bg-rose-50 text-rose-700"
              : "bg-slate-100 text-slate-700",
      )}
    >
      {String(value || "Unknown").replaceAll("_", " ")}
    </span>
  );
}
