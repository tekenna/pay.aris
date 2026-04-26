"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4200,
        style: {
          borderRadius: "12px",
          border: "1px solid #e4e9ef",
          background: "#ffffff",
          color: "#1f2937",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.12)",
          fontSize: "14px",
          fontWeight: 600,
        },
        success: {
          iconTheme: {
            primary: "#0a9550",
            secondary: "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ff3b47",
            secondary: "#ffffff",
          },
        },
      }}
    />
  );
}
