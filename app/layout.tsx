import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n"
import { LiquidUniverse } from "@/components/liquid-universe"
import { AuthProvider } from "@/hooks/useAuth"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FF9500" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
}

export const metadata: Metadata = {
  title: "FitVerse AI – Biohacking & Nutrition Intelligence",
  description:
    "AI-powered biohacking platform that analyzes food labels via photo to help you make healthier choices.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitVerse AI",
  },
  formatDetection: { telephone: false },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.className} antialiased text-foreground min-h-screen relative overflow-x-hidden`}
      >
        <LiquidUniverse />
        <div className="relative z-10 min-h-screen min-h-dvh">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <I18nProvider>
              <AuthProvider>{children}</AuthProvider>
            </I18nProvider>
          </ThemeProvider>
        </div>
      </body>
    </html>
  )
}