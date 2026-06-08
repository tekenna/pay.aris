import { ImageResponse } from "next/og";
import { siteDescription, siteName } from "@/app/seo";

export const alt = `${siteName} social preview`;
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #02555a 0%, #007074 45%, #2596be 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: "64px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "28px",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "36px",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "24px",
                background: "#2596be",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
                fontSize: "42px",
                fontWeight: 800,
              }}
            >
              A
            </div>
            <div
              style={{
                fontSize: "40px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              {siteName}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "820px" }}>
            <div
              style={{
                fontSize: "74px",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-0.045em",
              }}
            >
              Business payments and checkout, built for merchants.
            </div>
            <div
              style={{
                fontSize: "30px",
                lineHeight: 1.35,
                color: "rgba(255,255,255,0.78)",
              }}
            >
              {siteDescription}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
