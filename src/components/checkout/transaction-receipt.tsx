import Image from "next/image";

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

const ARIS_LOGO_URL = "/images/logo.svg";
const BRAND = "#2596be";
const BRAND_SOFT = "#e7f5fa";
const TEXT = "#273142";
const MUTED = "#6c7f9d";
const DIVIDER = "#e6edf5";

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

function maskDisplayValue(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) {
    return value || "--";
  }

  return `****${digits.slice(-4)}`;
}

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[182px_minmax(0,1fr)] items-start gap-6 py-[18px] text-[14px]">
      <p className="font-medium text-[#6f82a3]">{label}</p>
      <p className="text-right text-[14px] font-medium leading-6 text-[#273142]">
        {value}
      </p>
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
  const displayDate = formatReceiptDateTime(paidAt);
  const resolvedStatus =
    status === "success" ? "Transaction Successful" : status || "--";
  const sourceAccountDisplay = sourceAccountName
    ? maskDisplayValue(sourceAccountName)
    : "--";

  return (
    <div
      className="relative min-h-[842px] w-[595px] overflow-hidden bg-white font-app"
      style={{ color: TEXT }}
    >
      <div className="absolute inset-0 opacity-[0.13] [background-image:radial-gradient(circle_at_16%_14%,transparent_0_48px,#e7edf4_49px_50px,transparent_51px),radial-gradient(circle_at_75%_28%,transparent_0_62px,#e7edf4_63px_64px,transparent_65px),radial-gradient(circle_at_53%_73%,transparent_0_76px,#e7edf4_77px_78px,transparent_79px),radial-gradient(circle_at_18%_88%,transparent_0_54px,#e7edf4_55px_56px,transparent_57px)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,255,255,0.965))]" />

      <div className="relative z-10 px-[59px] pb-[68px] pt-[56px]">
        <div className="flex items-start justify-between gap-6">
          <Image
            src={ARIS_LOGO_URL}
            alt="Aris Pay"
            width={110}
            height={30}
            className="h-[30px] w-auto object-contain"
            priority
          />
          <p className="pt-[2px] text-[12px] font-medium text-[#92a2bc]">
            {displayDate}
          </p>
        </div>

        <div
          className="mt-[42px] h-[3px] w-full rounded-full"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, ${BRAND_SOFT} 0 4px, transparent 4px 8px)`,
          }}
        />

        <div className="mt-[21px]">
          <p className="text-[16px] font-semibold text-[#62779b]">Transfer Receipt</p>
          <p className="mt-[24px] text-[38px] font-semibold tracking-[-0.045em] text-[#25324a]">
            ₦{formatReceiptAmount(amount)}
          </p>
          <div
            className="mt-[22px] inline-flex rounded-[6px] px-[10px] py-[6px] text-[13px] font-medium"
            style={{ backgroundColor: BRAND_SOFT, color: BRAND }}
          >
            {resolvedStatus}
          </div>
        </div>

        <div className="mt-[42px] border-t border-dashed" style={{ borderColor: DIVIDER }} />

        <div>
          <ReceiptRow
            label="Beneficiary"
            value={`${recipientName} | ${accountNumber}`}
          />
          <div className="border-t border-dashed" style={{ borderColor: DIVIDER }} />
          <ReceiptRow label="Beneficiary Bank" value={bankName} />
        </div>

        <div className="mt-[2px] border-t border-dashed" style={{ borderColor: DIVIDER }} />

        <div>
          <ReceiptRow label="Source Bank" value={sourceBankName} />
          <div className="border-t border-dashed" style={{ borderColor: DIVIDER }} />
          <ReceiptRow label="Source Account" value={sourceAccountDisplay} />
          <div className="border-t border-dashed" style={{ borderColor: DIVIDER }} />
          <ReceiptRow label="Source Name" value={sourceAccountName || "--"} />
        </div>

        <div className="mt-[2px] border-t border-dashed" style={{ borderColor: DIVIDER }} />

        <div>
          <ReceiptRow label="Session ID" value={sessionId} />
        </div>

        <div className="mt-[2px] border-t border-dashed" style={{ borderColor: DIVIDER }} />

        <div>
          <ReceiptRow label="Narration" value={narration || "--"} />
        </div>

        <div className="mt-[2px] border-t border-dashed" style={{ borderColor: DIVIDER }} />
        <div className="mt-[78px] h-[3px] w-full" style={{ backgroundColor: BRAND }} />
      </div>
    </div>
  );
}
