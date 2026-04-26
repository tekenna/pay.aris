"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [15, 25, 35, 50, 75, 100];

export function Pagination({
  page,
  limit,
  totalPages,
  onPageChange,
  onLimitChange,
}: {
  page: number;
  limit: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5);

  return (
    <div className="flex flex-col gap-4 px-0 pb-0 pt-8 text-sm font-medium text-[#667085] md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span>Items per Page</span>
        <select
          value={limit}
          onChange={(event) => onLimitChange(Number(event.target.value))}
          className="h-7 rounded-[4px] border border-[#cfd7e2] bg-white px-2 text-sm text-[#667085] outline-none"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="h-9 rounded-[6px] px-2 text-[#344054]"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-[8px] text-sm font-semibold",
              pageNumber === page
                ? "bg-[#eff3f6] text-slate-900"
                : "text-slate-500 hover:bg-slate-50",
            )}
          >
            {pageNumber}
          </button>
        ))}
        {totalPages > 5 ? <span className="px-1">...</span> : null}
        <Button
          variant="ghost"
          className="h-9 rounded-[6px] px-2 text-[#344054]"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
