import type { NextConfig } from "next";

const x402Stub = "./src/lib/wallet/x402-stub.ts";

const nextConfig: NextConfig = {
  transpilePackages: ["@rainbow-me/rainbowkit"],
  turbopack: {
    resolveAlias: {
      "@x402/core/client": x402Stub,
      "@x402/evm": x402Stub,
      "@x402/evm/exact/client": x402Stub,
      "@x402/evm/upto/client": x402Stub,
      "@x402/svm/exact/client": x402Stub,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@x402/core/client": x402Stub,
      "@x402/evm": x402Stub,
      "@x402/evm/exact/client": x402Stub,
      "@x402/evm/upto/client": x402Stub,
      "@x402/svm/exact/client": x402Stub,
    };
    return config;
  },
};

export default nextConfig;
