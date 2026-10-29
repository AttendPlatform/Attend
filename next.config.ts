import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // Permits image rendering from any Supabase Storage bucket
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  register: true,
  customWorkerSrc: "worker",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);