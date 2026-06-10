import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/__clerk/:path*',
  '/api/clerk/webhooks(.*)',
  '/api/integracoes(.*)',
  '/api/mcp(.*)',
  '/api/chatgpt-app(.*)',
  '/api/claude-app(.*)',
  '/artifacts/dashboards/:path*',
  '/internal/mcp-ui(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/__clerk/:path*',
    '/(api|trpc)(.*)',
  ],
}
