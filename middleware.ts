import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// 1. Lista de E-mails Permitidos (Sócios)
const ALLOWED_ADMINS = [
  "socio1@fitverse.ai",
  "socio2@fitverse.ai",
  "socio3@fitverse.ai",
  "ferreiravictor280@gmail.com"
]

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const path = request.nextUrl.pathname

  // 2. Configuração de Headers de Segurança (CSP & Anti-Clickjacking)
  // Impede que o site seja exibido em iframes de outros domínios
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Content Security Policy (CSP) rigorosa
  // Ajuste 'script-src' conforme necessário se usar scripts externos (ex: Google Analytics)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.stripe.com;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
    connect-src 'self' https://api.stripe.com ws://localhost:3000 wss://localhost:3000;
    block-all-mixed-content;
    ${process.env.NODE_ENV === 'development' ? '' : 'upgrade-insecure-requests;'}
  `
  response.headers.set("Content-Security-Policy", cspHeader.replace(/\s{2,}/g, " ").trim())

  // 3. Proteção das Rotas Administrativas
  if (path.startsWith("/admin-dashboard") || path.startsWith("/api/admin")) {
    // Simulação de verificação de sessão. 
    // EM PRODUÇÃO: Use a função do seu provedor (ex: supabase.auth.getUser())
    // Aqui verificamos um cookie fictício ou header para demonstração.
    const userEmail = request.cookies.get("user_email")?.value

    // Se não houver usuário ou o email não estiver na lista de sócios
    if (!userEmail || !ALLOWED_ADMINS.includes(userEmail)) {
      
      // Se for rota de API, retorna 401 Unauthorized
      if (path.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Unauthorized: Access restricted to administrators." },
          { status: 401 }
        )
      }

      // Se for página, redireciona para a Home
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/admin-dashboard/:path*",
    "/api/admin/:path*",
  ],
}