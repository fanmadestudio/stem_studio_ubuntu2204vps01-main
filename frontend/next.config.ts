import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["hjjprd-3000.csb.app", "*.csb.app"],
  reactStrictMode: true,
  output: "standalone"
};

export default nextConfig;
