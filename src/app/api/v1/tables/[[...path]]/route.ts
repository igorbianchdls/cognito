import { tablesHandler } from '@/products/tables/api/handlers'
import { authenticateKey } from '@/products/tables/server/apiKeys'

// Public REST API of Tables: the same resources as the app, authenticated by API key.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const handler = (request: Request, context: { params: Promise<{ path?: string[] }> }) => tablesHandler(request, context, authenticateKey)
export const GET = handler
export const POST = handler
export const PATCH = handler
export const PUT = handler
export const DELETE = handler
