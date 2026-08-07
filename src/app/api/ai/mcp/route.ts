import { ottoMcpHandler } from '@/products/ai-platform/mcp/createOttoMcpHandler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

export { ottoMcpHandler as GET, ottoMcpHandler as POST }
