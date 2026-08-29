import { withSentryConfig } from "@sentry/nextjs"

const nextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['recharts','lucide-react','framer-motion','date-fns'] },
  images: {
    formats: ['image/avif','image/webp'],
    deviceSizes: [640,750,828,1080,1200],
    imageSizes: [16,32,48,64,96],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.in",
      },
    ],
  },
  compiler: { removeConsole: process.env.NODE_ENV==='production' ? { exclude: ['error'] } : false },
}

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  tunnelRoute: "/api/sentry-tunnel",
})
