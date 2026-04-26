import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ActivityChart({
  data,
}: {
  data: Array<{ label: string; primary: number; secondary: number }>;
}) {
  const maxValue = Math.max(...data.flatMap((item) => [item.primary, item.secondary]), 1);

  return (
    <Card className="p-5">
      <div className="mb-8 flex items-center justify-between gap-4">
        <p className="text-[18px] font-bold text-slate-950">Revenue Trend</p>
        <div className="flex items-center gap-5 text-[12px] font-medium text-slate-500">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#005a34]" />
            Gross
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#9ccfb7]" />
            Net
          </span>
        </div>
      </div>

      <div
        className="grid min-h-[370px] gap-5 overflow-x-auto border-t border-[#edf1f4] pt-10"
        style={{
          gridTemplateColumns: `repeat(${data.length}, minmax(58px, 1fr))`,
        }}
      >
        {data.map((item) => (
          <div key={item.label} className="flex flex-col justify-end gap-4">
            <div className="flex min-h-[285px] items-end justify-center gap-0">
              <div
                className="w-8 rounded-t-[6px] bg-[#005a34]"
                style={{ height: `${(item.primary / maxValue) * 230 + 20}px` }}
              />
              <div
                className={cn("w-8 rounded-t-[6px] bg-[#dfe3e8]")}
                style={{ height: `${(item.secondary / maxValue) * 230 + 20}px` }}
              />
            </div>
            <p className="text-center text-[13px] font-medium text-[#667085]">{item.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
