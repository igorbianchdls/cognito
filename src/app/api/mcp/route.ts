import { handlePluginRequest } from '@/products/chatgptplugin/mcp/handleRequest'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
const handler = (request: Request) => handlePluginRequest(request)
export { handler as POST, handler as GET, handler as DELETE, handler as OPTIONS }
