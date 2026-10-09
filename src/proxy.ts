import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextFetchEvent, type NextRequest } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/lp(.*)',
  '/lp-a(.*)',
  '/emissor-nota-fiscal(.*)',
  '/__clerk/:path*',
  '/api/clerk/webhooks(.*)',
])

// These read endpoints authenticate through withErpHttp and return its JSON
// 401/403 envelope. Keep Clerk middleware active so auth() has its context.
const isErpJsonReadRoute = createRouteMatcher(['/api/erp/dashboards(.*)', '/api/erp/acesso'])

const handleClerkMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request) && !isErpJsonReadRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // MCP verifies OAuth; internal jobs verify CRON_SECRET in their own handlers.
  if (['/api/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/api/mcp',
    '/api/claude/mcp', '/.well-known/oauth-protected-resource/api/claude/mcp',
    '/api/clerk/reconcile', '/api/chatgptplugin/internal/maintenance', '/api/erp/internal/automacoes']
    .includes(request.nextUrl.pathname)) return NextResponse.next()
  // Link temporário do DANFSe/XML: o token assinado é a credencial (validado no handler).
  if (request.nextUrl.pathname.startsWith('/api/public/nfse/')) return NextResponse.next()
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
