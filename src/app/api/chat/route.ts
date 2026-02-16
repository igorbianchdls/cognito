import { POST as chatPost } from '@/features/chat/backend/agents/controllers/chatActionController'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  return chatPost(req)
}
