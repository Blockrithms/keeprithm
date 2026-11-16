import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.app", "*.devtunnels.ms", "localhost:3000"],
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/internal",
        destination: "/login",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
