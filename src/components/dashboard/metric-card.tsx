import { Card } from "@/components/ui/card";
import { UserSquareIcon } from "@/components/ui/icons";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  kind = "number",
}: {
  label: string;
  value: number | string;
  kind?: "number" | "currency";
}) {
  return (
    <Card className="p-4">
      <div className="mb-8 flex items-center justify-between">
        {/* <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f6fbf8] text-[#00884f]">
          <UserSquareIcon className="h-4 w-4" />
        </span> */}
        <span className="rounded-full bg-[#e8f8ee] px-2.5 py-1 text-[12px] font-bold text-[#00884f]">
          +2.5%
        </span>
      </div>
      <p className="text-[14px] font-bold text-[#667085]">{label}</p>
      <p className="mt-2 text-[24px] font-bold tracking-[0.01em] text-[#344054]">
        {kind === "currency"
          ? formatCurrency(value)
          : typeof value === "string"
            ? value
            : formatNumber(value)}
      </p>
    </Card>
  );
}
