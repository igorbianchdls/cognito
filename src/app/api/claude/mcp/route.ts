import { handleClaudeRequest } from '@/products/claudeplugin/mcp/handleRequest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const handler = (request: Request) => handleClaudeRequest(request)
export { handler as POST, handler as GET, handler as DELETE, handler as OPTIONS }
