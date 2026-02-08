import { GET as messagesGet } from '@/features/chat/backend/controllers/chatMessagesController'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return messagesGet(req)
}
