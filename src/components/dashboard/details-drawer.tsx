import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";

export function DetailsDrawer({
  open,
  onClose,
  title,
  amount,
  status,
  timestamp,
  fields,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  amount: string;
  status: string;
  timestamp?: string | null;
  fields: Array<{ label: string; value: string | null | undefined }>;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/68">
      <button type="button" onClick={onClose} className="flex-1" aria-label="Close drawer" />
      <aside className="flex h-full w-full max-w-[486px] flex-col overflow-y-auto bg-white px-5 py-8 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h3 className="text-[20px] font-bold text-[#202939]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#edf2f7] text-2xl leading-none text-[#98a2b3]"
          >
            ×
          </button>
        </div>

        <div className="border-y border-dashed border-[#e2e8f0] py-9 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#16a34a] text-4xl text-white">
            ✓
          </div>
          <p className="text-[42px] font-bold leading-none tracking-[0.01em] text-[#202939]">{amount}</p>
          <div className="mt-5">
            <StatusBadge value={status} />
          </div>
          <p className="mt-4 text-sm font-medium text-[#98a2b3]">
            {formatDateTime(timestamp)}
          </p>
        </div>

        <div className="mt-7 space-y-5 border-b border-dashed border-[#e2e8f0] pb-8">
          {fields.map((field) => (
            <div key={field.label} className="grid grid-cols-[142px_minmax(0,1fr)] gap-4 text-[15px]">
              <span className="font-medium text-[#667085]">{field.label}</span>
              <span className="text-right font-semibold text-[#202939]">{field.value || "--"}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto grid gap-5 pt-8">
          <Button className="dashboard-black-button h-[52px] w-full rounded-[8px] text-[15px] font-bold">
            Print Receipt
          </Button>
          <Button variant="secondary" className="h-[52px] w-full rounded-[8px] bg-[#f2f4f7] text-[15px] font-bold text-[#344054] hover:bg-[#e9eef4]">
            Refund Payment
          </Button>
        </div>
      </aside>
    </div>
  );
}
