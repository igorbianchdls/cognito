import { GET as listGet } from '@/features/chat/backend/controllers/chatListController'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return listGet(req)
}
