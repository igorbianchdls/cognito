import { GET as listGet } from '@/products/chat/backend/controllers/chatListController'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return listGet(req)
}
