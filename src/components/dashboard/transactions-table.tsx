import type { BusinessTransaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

function truncateValue(value: string | null | undefined, visible = 24) {
  const text = String(value || "--");
  return text.length > visible ? `${text.slice(0, visible)}...` : text;
}

export function getTransactionType(transaction: BusinessTransaction) {
  if (transaction.direction === "credit" || transaction.direction === "debit") {
    return transaction.direction;
  }

  const before = Number(transaction.balanceBefore);
  const after = Number(transaction.balanceAfter);

  if (Number.isFinite(before) && Number.isFinite(after) && after < before) {
    return "debit";
  }

  if (
    transaction.paymentMethod === "checkout_fee" ||
    transaction.channel === "checkout_fee" ||
    String(transaction.reference || "").endsWith("-FEE")
  ) {
    return "debit";
  }

  return "credit";
}

export function getTransactionCategory(transaction: BusinessTransaction) {
  if (transaction.category === "checkout_fee") {
    return "Checkout Fee";
  }

  if (transaction.category === "checkout") {
    return "Checkout";
  }

  if (transaction.category === "payment_link") {
    return "Payment Link";
  }

  if (transaction.category === "transfer") {
    return "Transfer";
  }

  if (
    transaction.paymentMethod === "checkout_fee" ||
    transaction.channel === "checkout_fee" ||
    String(transaction.reference || "").endsWith("-FEE")
  ) {
    return "Checkout Fee";
  }

  if (transaction.sourceType === "api_checkout") {
    return "API Checkout";
  }

  if (transaction.sourceType === "payment_link") {
    return "Payment Link";
  }

  if (transaction.channel === "settlement") {
    return "Settlement";
  }

  if (transaction.paymentMethod === "bank_transfer") {
    return "Bank Transfer";
  }

  return "General";
}

function TransactionTypeBadge({ type }: { type: "credit" | "debit" }) {
  return (
    <span
      className={
        type === "credit"
          ? "inline-flex rounded-[6px] bg-[#eaf8ef] px-2.5 py-1 text-[12px] font-medium text-[#0a9251]"
          : "inline-flex rounded-[6px] bg-[#fff1f2] px-2.5 py-1 text-[12px] font-medium text-[#d92d20]"
      }
    >
      {type === "credit" ? "Credit" : "Debit"}
    </span>
  );
}

function TransactionCategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-flex rounded-[6px] bg-[#f2f4f7] px-3 py-1 text-[12px] font-semibold text-[#344054]">
      {category}
    </span>
  );
}

type TransactionsTableProps = {
  transactions: BusinessTransaction[];
  emptyMessage: string;
  onRowClick?: (transaction: BusinessTransaction) => void;
};

export function TransactionsTable({
  transactions,
  emptyMessage,
  onRowClick,
}: TransactionsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-[#eef2f6] text-[12px] font-semibold text-[#101828]">
          <tr>
            <th className="px-6 py-5">Date</th>
            <th className="px-6 py-5">Reference</th>
            <th className="px-6 py-5">Narration</th>
            <th className="px-6 py-5">Category</th>
            <th className="px-6 py-5">Type</th>
            <th className="px-6 py-5 text-right">Amount</th>
            <th className="px-6 py-5 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const transactionType = getTransactionType(item);
            const transactionCategory = getTransactionCategory(item);

            return (
              <tr
                key={item._id}
                className="cursor-pointer border-b border-[var(--border)] text-[14px] font-medium text-[#667085] transition hover:bg-[#fbfcfd]"
                onClick={() => onRowClick?.(item)}
              >
                <td className="whitespace-nowrap border-b border-[var(--border)] px-6 py-6">
                  {formatDate(item.createdAt)}
                </td>
                <td className="max-w-[220px] border-b border-[var(--border)] px-6 py-6">
                  <span className="block truncate" title={item.reference}>
                    {truncateValue(item.reference, 26)}
                  </span>
                </td>
                <td className="max-w-[280px] border-b border-[var(--border)] px-6 py-6">
                  <span
                    className="block truncate"
                    title={item.narration || undefined}
                  >
                    {truncateValue(item.narration, 30)}
                  </span>
                </td>
                <td className="border-b border-[var(--border)] px-6 py-6">
                  <TransactionCategoryBadge category={transactionCategory} />
                </td>
                <td className="border-b border-[var(--border)] px-6 py-6">
                  <TransactionTypeBadge type={transactionType} />
                </td>
                <td className="whitespace-nowrap border-b border-[var(--border)] px-6 py-6 text-right font-bold text-[#344054]">
                  {formatCurrency(item.amount, item.currency)}
                </td>
                <td className="whitespace-nowrap border-b border-[var(--border)] px-6 py-6 text-right font-bold text-[#344054]">
                  {formatCurrency(item.balanceAfter, item.currency)}
                </td>
              </tr>
            );
          })}
          {!transactions.length ? (
            <tr>
              <td colSpan={7} className="px-6 py-14 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
