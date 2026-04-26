import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
  maxWidthClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidthClassName?: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 px-4 py-8">
      <div className="flex min-h-full items-start justify-center">
        <div
          className={cn(
            "my-auto w-full rounded-[32px] bg-white p-7 shadow-2xl",
            maxWidthClassName || "max-w-xl",
            className,
          )}
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
              {description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            >
              x
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
