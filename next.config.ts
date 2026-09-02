import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // config options here
};

// Sentry only wraps the build when a DSN is configured; otherwise the config is
// untouched. Source-map upload additionally needs SENTRY_AUTH_TOKEN in CI.
export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      silent: !process.env.CI,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  : nextConfig;
