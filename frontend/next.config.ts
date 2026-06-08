import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@api-mock-generator/shared'],
};

export default nextConfig;
