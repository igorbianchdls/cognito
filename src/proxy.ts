import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/api/analytics/eventos',
  '/api/inbox/webhook/(.*)',
  '/api/inbox/vendas/(.*)',
  '/api/inbox/sair',
  '/otto.js',
  // Clipes do provedor de demonstração de Marketing → Vídeos: o servidor os baixa sem sessão.
  '/marketing/videos-demo/(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/entrando',
  '/lp(.*)',
  '/sistemas',
  '/limpeza',
  '/cursos',
  '/imobiliaria',
  '/petshop',
  '/salao',
  '/estetica',
  '/eventos',
  '/obras',
  '/construcao',
  '/marcenaria',
  '/oficina',
  '/roupas',
  '/moda',
  '/assistencia',
  '/hotel',
  '/lp-a(.*)',
  '/ottocut(.*)',
  '/ottogestao(.*)',
  '/emissor-nota-fiscal(.*)',
  '/p/(.*)',
  // Notas publicadas na web: o token do link é a credencial (conferido no servidor).
  '/n/(.*)',
  '/api/notas/publico/(.*)',
  '/__clerk/:path*',
  '/api/clerk/webhooks(.*)',
])

// These read endpoints authenticate through withErpHttp and return its JSON
// 401/403 envelope. Keep Clerk middleware active so auth() has its context.
const isErpJsonReadRoute = createRouteMatcher(['/api/erp/dashboards(.*)', '/api/erp/acesso', '/api/contador(.*)'])

const handleClerkMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request) && !isErpJsonReadRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // MCP verifies OAuth; internal jobs verify CRON_SECRET in their own handlers.
  if (['/api/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/api/mcp',
    '/api/claude/mcp', '/.well-known/oauth-protected-resource/api/claude/mcp',
    '/api/clerk/reconcile', '/api/chatgptplugin/internal/maintenance', '/api/erp/internal/automacoes', '/api/inbox/internal/tick', '/api/notas/internal/tarefas']
    .includes(request.nextUrl.pathname)) return NextResponse.next()
  // Link temporário do DANFSe/XML: o token assinado é a credencial (validado no handler).
  if (request.nextUrl.pathname.startsWith('/api/public/nfse/') || request.nextUrl.pathname.startsWith('/api/public/documentos-comerciais/')) return NextResponse.next()
  // Testes de tela das Notas (npm run notas:ui): só fora de produção e com NOTAS_TESTE_USUARIO definido.
  if (process.env.NODE_ENV !== 'production' && process.env.NOTAS_TESTE_USUARIO
    && (request.nextUrl.pathname.startsWith('/api/notas/') || /^\/(notas|artefatos)(\/|$)/.test(request.nextUrl.pathname))) return NextResponse.next()
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && isPublicRoute(request)) {
    return NextResponse.next()
  }
  return handleClerkMiddleware(request, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
}
