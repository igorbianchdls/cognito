import { GET as messagesGet } from '@/products/chat/backend/features/chat/controllers/chatMessagesController'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return messagesGet(req)
}
