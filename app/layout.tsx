import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/lib/i18n"
import { AuthProvider } from "@/hooks/useAuth"
import { Analytics } from "@/components/analytics"

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
  formatDetection: { telephone: false },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://*.supabase.co" />
        <link rel="dns-prefetch" href="https://*.supabase.co" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var saved = localStorage.getItem("fitverse-accent");
              var colors = {green:"#34D399",blue:"#0A84FF",purple:"#BF5AF2",pink:"#FF375F",orange:"#FF9500",red:"#FF453A"};
              var hex = colors[saved];
              if (!hex) return;
              var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
              var s = document.documentElement.style;
              s.setProperty("--brand", hex);
              s.setProperty("--brand-foreground", r<128?"#FFFFFF":"#0A0A0A");
              s.setProperty("--brand-muted", "rgba("+r+","+g+","+b+",0.12)");
              s.setProperty("--brand-hover", "rgba("+r+","+g+","+b+",0.20)");
              s.setProperty("--ring", hex);
            } catch(e){}
          })();
        ` }} />
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
              {children}
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
