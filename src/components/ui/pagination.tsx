"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronLeft } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [15, 25, 35, 50, 75, 100];

type PaginationItem = number | "ellipsis";

function getPaginationItems(page: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", totalPages];
  }

  if (page >= totalPages - 3) {
    return [1, "ellipsis", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "ellipsis", page - 1, page, page + 1, "ellipsis", totalPages];
}

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
  const normalizedTotalPages = Math.max(1, totalPages);
  const currentPage = Math.min(Math.max(page, 1), normalizedTotalPages);
  const canMoveBackward = currentPage > 1;
  const canMoveForward = currentPage < normalizedTotalPages;
  const pageItems = getPaginationItems(currentPage, normalizedTotalPages);
  const pageSizeOptions = Array.from(new Set([...PAGE_SIZES, limit])).sort((left, right) => left - right);

  return (
    <div className="flex flex-col gap-4 border-t border-[var(--border)] px-0 pb-0 pt-6 text-sm font-medium text-[#667085] md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span>Items per Page</span>
        <div className="relative">
          <select
            value={String(limit)}
            onChange={(event) => onLimitChange(Number(event.target.value))}
            className="h-10 appearance-none rounded-[10px] border border-[var(--border)] bg-white pl-3 pr-9 text-sm font-medium text-[#344054] outline-none transition focus:border-[#98a2b3]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#667085]" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto">
        <Button
          variant="ghost"
          className="h-9 rounded-[10px] px-2.5 text-[#667085] hover:bg-[#f9fafb] hover:text-[#344054]"
          disabled={!canMoveBackward}
          onClick={() => canMoveBackward && onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {pageItems.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 min-w-9 items-center justify-center px-1 text-[#98a2b3]"
            >
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === currentPage ? "page" : undefined}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-[10px] px-3 text-sm font-semibold transition",
                item === currentPage
                  ? "border border-[#eaecf0] bg-white text-[#101828] shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                  : "text-[#667085] hover:bg-[#f9fafb] hover:text-[#344054]",
              )}
            >
              {item}
            </button>
          ),
        )}

        <Button
          variant="ghost"
          className="h-9 rounded-[10px] px-2.5 text-[#667085] hover:bg-[#f9fafb] hover:text-[#344054]"
          disabled={!canMoveForward}
          onClick={() => canMoveForward && onPageChange(currentPage + 1)}
        >
          Next
          <ChevronLeft className="h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
