import { GET as metaGet } from '@/products/chat/backend/features/chat/controllers/chatMetaController'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return metaGet(req)
}
