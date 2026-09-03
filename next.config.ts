import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Note: the `eslint` key was removed here — Next.js 16 no longer supports it
  // (linting is no longer part of `next build`), so it was doing nothing except
  // printing two "Invalid next.config.ts options" warnings on every startup.
};

export default nextConfig;
