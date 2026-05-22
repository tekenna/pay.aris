import type { Metadata } from "next";
import { Archivo, Rubik } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/store/app-providers";
import { Toaster } from "@/components/ui/toaster";
import { getSiteUrl, siteDescription, siteName } from "@/app/seo";

const siteUrl = getSiteUrl();
const rubik = Rubik({
  subsets: ["latin"],
  variable: "--font-rubik",
  display: "swap",
});
const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: siteName,
  title: {
    default: siteName,
    template: "%s | Aris Pay",
  },
  description: siteDescription,
  keywords: [
    "Aris Pay",
    "merchant payments",
    "business checkout",
    "settlement dashboard",
    "payment operations",
    "virtual accounts",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/images/auth-vector.svg", type: "image/svg+xml" },
    ],
    shortcut: ["/images/auth-vector.svg"],
    apple: ["/images/auth-vector.svg"],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${siteName} social preview`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  category: "finance",
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${rubik.variable} ${archivo.variable}`}>
      <body suppressHydrationWarning className="font-app">
        <AppProviders>{children}</AppProviders>
        <Toaster />
      </body>
    </html>
  );
}
