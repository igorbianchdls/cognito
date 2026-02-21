import { POST as relayPost } from '@/app/api/agent-relay-lite/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

export async function POST(req: Request) {
  return relayPost(req)
}
