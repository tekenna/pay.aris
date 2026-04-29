"use client";

import { useMemo } from "react";
import qrcode from "qrcode-generator";

export function QrCode({
  value,
  size = 192,
  className = "",
}: {
  value?: string | null;
  size?: number;
  className?: string;
}) {
  const markup = useMemo(() => {
    if (!value) {
      return null;
    }

    const qr = qrcode(0, "M");
    qr.addData(value, "Byte");
    qr.make();

    return qr.createSvgTag({
      cellSize: 6,
      margin: 2,
      scalable: true,
    });
  }, [value]);

  if (!markup) {
    return (
      <div
        className={`flex items-center justify-center rounded-[20px] border border-dashed border-[#d0d5dd] bg-[#f8fafc] text-center text-sm font-medium text-[#98a2b3] ${className}`}
        style={{ width: size, height: size }}
      >
        QR unavailable
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-[20px] border border-[#e4e7ec] bg-white p-3 shadow-[0_20px_45px_rgba(15,23,42,0.08)] ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </div>
  );
}
