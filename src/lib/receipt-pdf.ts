import jsPDF from "jspdf";

export type ReceiptPdfData = {
  amount: number;
  paidAt?: string | null;
  status?: string | null;
  sessionId: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  sourceBankName: string;
  sourceAccountNumber?: string | null;
  sourceAccountName: string;
  narration?: string | null;
};

const ARIS_LOGO_URL =
  "https://res.cloudinary.com/doopxwl8l/image/upload/q_auto/f_auto/v1777482297/logo_fy7vut.png";

const COLORS = {
  brand: "#0a9251",
  brandDeep: "#045c38",
  brandSoft: "#eaf8ef",
  text: "#273142",
  muted: "#6c7f9d",
  divider: "#dfe8f1",
  statusBg: "#eaf8ef",
  statusText: "#0a9251",
  pageBg: "#ffffff",
  footer: "#0a3d2a",
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

function maskDisplayValue(value?: string | null) {
  const raw = String(value || "");
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) {
    return raw || "--";
  }

  return `****${digits.slice(-4)}`;
}

function getReceiptStatus(status?: string | null) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "success") {
    return "Transaction Successful";
  }

  if (!normalized) {
    return "--";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function drawDottedRule(
  pdf: jsPDF,
  x: number,
  y: number,
  width: number,
  color: string,
) {
  pdf.setDrawColor(color);
  pdf.setLineWidth(1);
  for (let current = x; current < x + width; current += 8) {
    pdf.line(current, y, Math.min(current + 4, x + width), y);
  }
}

function drawRow(
  pdf: jsPDF,
  y: number,
  label: string,
  value: string,
  contentX: number,
  contentWidth: number,
) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(COLORS.muted);
  pdf.text(label, contentX, y);

  pdf.setFont("helvetica", "medium");
  pdf.setTextColor(COLORS.text);
  const valueLines = pdf.splitTextToSize(value || "--", 225);
  pdf.text(valueLines, contentX + contentWidth, y, { align: "right" });

  const lineHeight = valueLines.length > 1 ? valueLines.length * 13 : 16;
  const dividerY = y + lineHeight + 10;
  drawDottedRule(pdf, contentX, dividerY, contentWidth, COLORS.divider);

  return dividerY + 18;
}

async function loadImageData(url: string) {
  return await new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to prepare receipt logo."));
        return;
      }

      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("Unable to load receipt logo."));
    image.src = url;
  });
}

export async function downloadReceiptPdf(
  receipt: ReceiptPdfData,
  filename: string,
) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const contentX = 46;
  const contentWidth = pageWidth - contentX * 2;
  let cursorY = 52;

  pdf.setFillColor(COLORS.pageBg);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  try {
    const logoData = await loadImageData(ARIS_LOGO_URL);
    pdf.addImage(logoData, "PNG", contentX, cursorY, 108, 30);
  } catch {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(COLORS.brand);
    pdf.text("Aris Pay", contentX, cursorY + 20);
  }

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor("#92a2bc");
  pdf.text(formatReceiptDateTime(receipt.paidAt), pageWidth - 46, cursorY + 16, {
    align: "right",
  });

  cursorY += 48;
  drawDottedRule(pdf, contentX, cursorY, contentWidth, "#cfe4d7");

  cursorY += 30;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(COLORS.muted);
  pdf.text("Transfer Receipt", contentX, cursorY);

  cursorY += 34;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(32);
  pdf.setTextColor(COLORS.text);
  pdf.text(`NGN ${formatReceiptAmount(receipt.amount)}`, contentX, cursorY);

  cursorY += 24;
  pdf.setFillColor(COLORS.statusBg);
  pdf.roundedRect(contentX, cursorY, 134, 26, 4, 4, "F");
  pdf.setFont("helvetica", "medium");
  pdf.setFontSize(11);
  pdf.setTextColor(COLORS.statusText);
  pdf.text(getReceiptStatus(receipt.status), contentX + 8, cursorY + 17);

  cursorY += 44;
  drawDottedRule(pdf, contentX, cursorY, contentWidth, COLORS.divider);
  cursorY += 22;

  cursorY = drawRow(
    pdf,
    cursorY,
    "Beneficiary",
    `${receipt.recipientName} | ${receipt.accountNumber}`,
    contentX,
    contentWidth,
  );
  cursorY = drawRow(
    pdf,
    cursorY,
    "Beneficiary Bank",
    receipt.bankName || "--",
    contentX,
    contentWidth,
  );
  cursorY = drawRow(
    pdf,
    cursorY,
    "Source Bank",
    receipt.sourceBankName || "--",
    contentX,
    contentWidth,
  );
  cursorY = drawRow(
    pdf,
    cursorY,
    "Source Account",
    maskDisplayValue(receipt.sourceAccountNumber),
    contentX,
    contentWidth,
  );
  cursorY = drawRow(
    pdf,
    cursorY,
    "Source Name",
    receipt.sourceAccountName || "--",
    contentX,
    contentWidth,
  );
  cursorY = drawRow(
    pdf,
    cursorY,
    "Session ID",
    receipt.sessionId || "--",
    contentX,
    contentWidth,
  );
  cursorY = drawRow(
    pdf,
    cursorY,
    "Narration",
    receipt.narration || "--",
    contentX,
    contentWidth,
  );

  pdf.setFillColor(COLORS.footer);
  pdf.rect(0, pageHeight - 10, pageWidth, 10, "F");
  pdf.save(filename);
}
