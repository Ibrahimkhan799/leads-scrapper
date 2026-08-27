import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "prisma", "bullmq", "ioredis", "playwright"],
};

export default nextConfig;
