import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
