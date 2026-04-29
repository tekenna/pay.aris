import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Complete a secure bank transfer checkout session with Aris Pay.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function CheckoutReferenceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

