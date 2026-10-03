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

const handleClerkMiddleware = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  // Estas rotas possuem verificacao OAuth propria; nao aceitam sessao do navegador.
  if (['/api/mcp', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/api/mcp']
    .includes(request.nextUrl.pathname)) return NextResponse.next()
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
