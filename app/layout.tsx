import type React from "react"
import type { Metadata } from "next"
// Substituindo Geist pela Inter para evitar erro de build
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

// Configuração da fonte Inter (padrão e segura para o Vercel)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Fitverse AI",
  description: "Assistente de biohacking que analisa rótulos via foto para ajudar você a fazer escolhas mais saudáveis",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Espaço para o seu Pixel de Conversão futuramente */}
      </head>
      {/* Aplicando a fonte Inter e removendo referências à Geist */}
      <body className={`${inter.className} antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}