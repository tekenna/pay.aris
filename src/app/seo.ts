const FALLBACK_SITE_URL = "https://aris-pay.onrender.com";

export const siteName = "Aris Pay";
export const siteDescription =
  "Aris Pay helps merchants manage business payments, secure checkout flows, settlements, and transaction operations from one dashboard.";

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    FALLBACK_SITE_URL;

  try {
    return new URL(configuredUrl);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

