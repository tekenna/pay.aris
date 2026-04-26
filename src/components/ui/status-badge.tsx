import { cn } from "@/lib/utils";

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const normalized = String(value || "unknown").toLowerCase();

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        normalized.includes("success") ||
          normalized.includes("active") ||
          normalized.includes("completed") ||
          normalized === "ok"
          ? "bg-emerald-50 text-emerald-600"
          : normalized.includes("pending")
            ? "bg-amber-50 text-amber-600"
            : normalized.includes("failed") || normalized.includes("rejected")
              ? "bg-rose-50 text-rose-600"
              : "bg-slate-100 text-slate-600",
      )}
    >
      {String(value || "Unknown").replaceAll("_", " ")}
    </span>
  );
}
