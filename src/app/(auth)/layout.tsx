import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Merchant Access",
    template: "%s | Aris Pay",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

