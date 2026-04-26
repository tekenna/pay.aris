import type { BusinessTransaction } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

function truncateValue(value: string | null | undefined, visible = 24) {
  const text = String(value || "--");
  return text.length > visible ? `${text.slice(0, visible)}...` : text;
}

export function getTransactionType(transaction: BusinessTransaction) {
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

function TransactionTypeBadge({ type }: { type: "credit" | "debit" }) {
  return (
    <span
      className={
        type === "credit"
          ? "inline-flex rounded-[4px] bg-[#eaf4ff] px-2 py-1 text-[12px] font-medium text-[#0066c9]"
          : "inline-flex rounded-[4px] bg-[#fff0f0] px-2 py-1 text-[12px] font-medium text-[#ff2323]"
      }
    >
      {type === "credit" ? "Credit" : "Debit"}
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
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#f7f9fb] text-[11px] uppercase tracking-[0.12em] text-[#667085]">
          <tr>
            <th className="px-4 py-4">Date</th>
            <th className="px-4 py-4">Reference</th>
            <th className="px-4 py-4">Narration</th>
            <th className="px-4 py-4">Type</th>
            <th className="px-4 py-4 text-right">Amount</th>
            <th className="px-4 py-4 text-right">Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item) => {
            const transactionType = getTransactionType(item);

            return (
              <tr
                key={item._id}
                className="cursor-pointer border-b border-slate-100 text-[15px] font-medium text-[#667085] hover:bg-slate-50"
                onClick={() => onRowClick?.(item)}
              >
                <td className="whitespace-nowrap px-4 py-7">
                  {formatDate(item.createdAt)}
                </td>
                <td className="max-w-[220px] px-4 py-7">
                  <span className="block truncate" title={item.reference}>
                    {truncateValue(item.reference, 26)}
                  </span>
                </td>
                <td className="max-w-[280px] px-4 py-7">
                  <span
                    className="block truncate"
                    title={item.narration || undefined}
                  >
                    {truncateValue(item.narration, 30)}
                  </span>
                </td>
                <td className="px-4 py-7">
                  <TransactionTypeBadge type={transactionType} />
                </td>
                <td className="whitespace-nowrap px-4 py-7 text-right font-bold text-[#344054]">
                  {formatCurrency(item.amount, item.currency)}
                </td>
                <td className="whitespace-nowrap px-4 py-7 text-right font-bold text-[#344054]">
                  {formatCurrency(item.balanceAfter, item.currency)}
                </td>
              </tr>
            );
          })}
          {!transactions.length ? (
            <tr>
              <td colSpan={6} className="px-6 py-14 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
