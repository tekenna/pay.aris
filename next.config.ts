import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/accounts",
        destination: "/dashboard/accounts",
        permanent: false,
      },
      {
        source: "/accounts/:path*",
        destination: "/dashboard/accounts/:path*",
        permanent: false,
      },
      {
        source: "/payment",
        destination: "/dashboard/payment",
        permanent: false,
      },
      {
        source: "/transactions",
        destination: "/dashboard/transactions",
        permanent: false,
      },
      {
        source: "/developers",
        destination: "/dashboard/developers",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/dashboard/settings",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
