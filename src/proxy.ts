import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
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
  '/emissor-nota-fiscal(.*)',
  '/p/(.*)',
  '/__clerk/:path*',
  '/api/clerk/webhooks(.*)',
])

// These read endpoints authenticate through withErpHttp and return its JSON
// 401/403 envelope. Keep Clerk middleware active so auth() has its context.
const isErpJsonReadRoute = createRouteMatcher(['/api/erp/dashboards(.*)', '/api/erp/acesso', '/api/contador(.*)', '/api/tables(.*)', '/api/apps(.*)'])

const handleClerkMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request) && !isErpJsonReadRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

// Own domains of public apps: any host that is not this platform may be one. The public address is
// asked once a minute per host; hosts that are not app domains continue as usual.
const appHosts = new Map<string, { slug: string | null; until: number }>()
const platformHost = (host: string) => /(^|\.)(vercel\.app|localhost)(:\d+)?$|^127\.0\.0\.1(:\d+)?$/i.test(host) || (process.env.APP_HOSTS ?? '').split(',').map(h => h.trim()).filter(Boolean).includes(host)
async function appDomain(request: NextRequest) {
  const host = (request.headers.get('host') ?? '').toLowerCase(), path = request.nextUrl.pathname
  if (!host || platformHost(host) || path.startsWith('/api/') || path.startsWith('/_next') || path.startsWith('/p/')) return null
  const hit = appHosts.get(host)
  if (hit && hit.until > Date.now()) return hit.slug
  const slug = await fetch(new URL(`/api/public/apps/_/dominio?host=${encodeURIComponent(host)}`, request.url), { cache: 'no-store' }).then(r => r.ok ? r.json() : null).then(d => (d?.slug as string | null) ?? null).catch(() => null)
  appHosts.set(host, { slug, until: Date.now() + 60_000 })
  return slug
}

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const appSlug = await appDomain(request)
  if (appSlug) return NextResponse.rewrite(new URL(`/p/${appSlug}`, request.url))
  // MCP verifies OAuth; internal jobs verify CRON_SECRET in their own handlers.
  if (['/api/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/api/mcp',
    '/api/claude/mcp', '/.well-known/oauth-protected-resource/api/claude/mcp',
    '/api/clerk/reconcile', '/api/chatgptplugin/internal/maintenance', '/api/erp/internal/automacoes']
    .includes(request.nextUrl.pathname)) return NextResponse.next()
  // Link temporário do DANFSe/XML: o token assinado é a credencial (validado no handler).
  if (request.nextUrl.pathname.startsWith('/api/public/nfse/') || request.nextUrl.pathname.startsWith('/api/public/documentos-comerciais/')) return NextResponse.next()
  // Apps públicos: a página /p/<endereço> e sua API não exigem login; o token assinado do runtime é a credencial.
  if (request.nextUrl.pathname.startsWith('/api/public/apps/')) return NextResponse.next()
  // API do Tables com chave: a chave de API (Authorization: Bearer ctk_…) é validada no handler.
  if (request.nextUrl.pathname.startsWith('/api/v1/tables')) return NextResponse.next()
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
