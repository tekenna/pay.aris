import Image from "next/image";
import { getBankLogoUrl } from "@/lib/bank-suggestions";

type TransactionReceiptProps = {
  amount: number;
  paidAt?: string | null;
  status?: string | null;
  sessionId: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  sourceBankName: string;
  sourceAccountName: string;
  narration?: string | null;
};

function formatReceiptAmount(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatReceiptDateTime(value?: string | null) {
  if (!value) {
    return "--";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function ReceiptRow({
  label,
  value,
  logoSrc,
}: {
  label: string;
  value: string;
  logoSrc?: string | null;
}) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] items-start gap-6 py-4 text-[14px]">
      <p className="text-[#7d879c]">{label}</p>
      <div className="justify-self-end text-right text-[#1d2746]">
        {logoSrc ? (
          <div className="mb-2 flex items-center justify-end gap-2">
            <Image src={logoSrc} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
            <span>{value}</span>
          </div>
        ) : (
          <p>{value}</p>
        )}
      </div>
    </div>
  );
}

export function TransactionReceipt({
  amount,
  paidAt,
  status,
  sessionId,
  recipientName,
  bankName,
  accountNumber,
  sourceBankName,
  sourceAccountName,
  narration,
}: TransactionReceiptProps) {
  const recipientBankLogo = getBankLogoUrl(bankName);
  const sourceBankLogo = getBankLogoUrl(sourceBankName);
  const resolvedStatus = status === "success" ? "00 - Approved or Completed Successfully" : status || "--";

  return (
    <div className="relative w-[595px] overflow-hidden bg-white font-sans text-[#1d2746]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(0,136,79,0.05),transparent_22%),radial-gradient(circle_at_77%_19%,rgba(77,179,129,0.08),transparent_16%),radial-gradient(circle_at_45%_58%,rgba(15,127,69,0.05),transparent_24%),radial-gradient(circle_at_82%_76%,rgba(16,185,129,0.05),transparent_18%)]" />
      <div className="absolute left-0 top-0 h-[76px] w-[84px] bg-[#00884f]" />
      <div className="absolute left-6 right-6 top-0 h-[78px] rounded-b-[2px] bg-[linear-gradient(90deg,rgba(231,248,238,0.96),rgba(245,252,248,0.9))]" />
      <div className="relative z-10 px-6 pb-14 pt-10">
        <div className="flex items-start justify-between">
          <p className="pt-4 text-[13px] font-semibold tracking-[0.02em] text-[#1b2a22]">
            TRANSACTION RECEIPT
          </p>
          <Image
            src="/images/white-logo.svg"
            alt="Aris Pay"
            width={162}
            height={34}
            className="h-[34px] w-[162px] object-contain object-right logo-on-light"
            priority
          />
        </div>

        <div className="mt-10 flex flex-col items-center">
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-[#0aa35d] shadow-[0_10px_28px_rgba(10,163,93,0.28)]">
            <div className="flex h-[54px] w-[54px] items-center justify-center rounded-full border-[8px] border-white/35 text-[32px] font-semibold text-white">
              ✓
            </div>
          </div>
          <p className="mt-8 text-[48px] font-semibold leading-none tracking-[-0.04em] text-[#1d2746]">
            ₦{formatReceiptAmount(amount)}
          </p>
          <div className="mt-4 rounded-[4px] bg-[#e4f8ec] px-3 py-1.5 text-[13px] font-medium text-[#0a7c47]">
            Transaction Successful
          </div>
          <p className="mt-8 text-[14px] text-[#7f8ba3]">{formatReceiptDateTime(paidAt)}</p>
        </div>

        <div className="mt-8 border-t border-dashed border-[#e7ebf1]" />

        <div className="mt-3">
          <ReceiptRow label="Status" value={resolvedStatus} />
          <ReceiptRow label="Session ID" value={sessionId} />
          <ReceiptRow label="Transaction Type" value="Inwards" />
          <ReceiptRow label="Recipient" value={recipientName} />
          <ReceiptRow label="Bank Name" value={bankName} logoSrc={recipientBankLogo} />
          <ReceiptRow label="Account Number" value={accountNumber} />
          <ReceiptRow label="Source Bank" value={sourceBankName} logoSrc={sourceBankLogo} />
          <ReceiptRow label="Source Account" value={sourceAccountName} />
          <ReceiptRow label="Narration" value={narration || "--"} />
        </div>

        <div className="mt-12 border-t-[3px] border-[#00884f]" />
        <p className="mt-4 text-[13px] text-[#7d879c]">Disclaimer:</p>
      </div>
    </div>
  );
}
