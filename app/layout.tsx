import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n"
import { AuthProvider } from "@/hooks/useAuth"
import { Analytics } from "@/components/analytics"
import { ServiceWorkerRegister } from "@/components/service-worker-register"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FA" },
    { media: "(prefers-color-scheme: dark)", color: "#09090B" },
  ],
}

export const metadata: Metadata = {
  title: "FitVerse AI",
  description: "AI-powered nutrition & fitness intelligence. Scan food, track macros, stay healthy.",
  openGraph: {
    title: "FitVerse AI",
    description: "AI-powered nutrition & fitness intelligence. Scan food, track macros, stay healthy.",
    url: "https://fitverse.app",
    siteName: "FitVerse AI",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "FitVerse AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitVerse AI",
    description: "AI-powered nutrition & fitness intelligence. Scan food, track macros, stay healthy.",
    images: ["/og.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitVerse AI",
  },
  formatDetection: { telephone: false },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://*.supabase.co" />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        )}
      </head>
      <body
        className={`${inter.className} antialiased text-foreground min-h-screen bg-background`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <AuthProvider>
              <ServiceWorkerRegister />
              {children}
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
