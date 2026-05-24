import type { NextConfig } from "next";
import path from "path";

const BACKEND_URL =
  process.env.BACKEND_PROXY_URL ||
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8081"
    : "http://3.150.217.155/connectify");

if (
  process.env.VERCEL === "1" &&
  !process.env.NEXT_PUBLIC_SOCKET_SECURE_URL &&
  !process.env.NEXT_PUBLIC_SOCKET_URL?.startsWith("https://")
) {
  console.warn(
    "[build] Vercel deploy: set NEXT_PUBLIC_SOCKET_URL=https://your-api-domain.com " +
      "or NEXT_PUBLIC_SOCKET_SECURE_URL for WSS. HTTP sockets fail on HTTPS pages.",
  );
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: {
    position: "bottom-right",
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "reaz8080.syedbipul.me",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "backet-for-confaero.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "backet-for-confaero.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "backet-for-confaero.s3.us-east-2.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
