import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  allowedDevOrigins: ["*.monkeycode-ai.live"],
};

export default nextConfig;
