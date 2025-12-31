import type React from "react"
import type { Metadata } from "next"
// Substituindo Geist pela Inter para evitar erro de build
import { Inter } from "next/font/google"
import "./globals.css"

// Configuração da fonte Inter (padrão e segura para o Vercel)
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Fitverse - Seu Personal Shopper de Longevidade",
  description: "Assistente de biohacking que analisa rótulos via foto para ajudar você a fazer escolhas mais saudáveis",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    "apple-touch-icon": "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Espaço para o seu Pixel de Conversão futuramente */}
      </head>
      {/* Aplicando a fonte Inter e removendo referências à Geist */}
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}