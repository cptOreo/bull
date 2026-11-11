import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [] },
  experimental: {
    webVitalsAttribution: ["CLS", "LCP"],
  },
  async redirects() {
    return [
      {
        source: "/academy",
        destination: "/learn",
        permanent: true,
      },
      {
        source: "/academy/quiz",
        destination: "/practice",
        permanent: true,
      },
      {
        source: "/academy/:concept",
        destination: "/learn",
        permanent: true,
      },
      {
        source: "/progress",
        destination: "/profile",
        permanent: true,
      },
      {
        source: "/research",
        destination: "/?tab=tutor",
        permanent: false,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Web Worker support for heuristics computation
    config.module.rules.push({
      test: /\.worker\.ts$/,
      use: { loader: "worker-loader", options: { filename: "static/workers/[hash].worker.js", publicPath: "/_next/" } },
    });
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, net: false, tls: false };
    }
    return config;
  },
};

export default nextConfig;