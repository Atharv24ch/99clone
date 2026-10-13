import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode for better DX
  reactStrictMode: true,

  // Transpile workspace packages (Turborepo doesn't transform node_modules by default)
  transpilePackages: ["@99acres/ui", "@99acres/db"],

  // Image optimization
  images: {
    remotePatterns: [
      // Production CDN — set NEXT_PUBLIC_CDN_URL=https://cdn.yourdomain.com on Vercel
      ...(process.env["NEXT_PUBLIC_CDN_URL"]
        ? [{
            protocol: "https" as const,
            hostname: new URL(process.env["NEXT_PUBLIC_CDN_URL"]).hostname,
          }]
        : []),
      { protocol: "http", hostname: "localhost", port: "4566" }, // LocalStack dev
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // Google avatars
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [32, 64, 96, 128, 256, 384],
  },

  // Experimental features
  experimental: {
    // Partial pre-rendering for search pages
    ppr: false,
    // Optimise package imports
    optimizePackageImports: ["lucide-react", "@99acres/ui"],
  },

  // Redirect www -> non-www in production
  // Set NEXT_PUBLIC_DOMAIN=yourdomain.com on Vercel (without https://)
  async redirects() {
    const domain = process.env["NEXT_PUBLIC_DOMAIN"];
    if (process.env["NODE_ENV"] === "production" && domain) {
      return [
        {
          source: "/(.*)",
          has: [{ type: "host" as const, value: `www.${domain}` }],
          destination: `https://${domain}/:path*`,
          permanent: true,
        },
      ];
    }
    return [];
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
