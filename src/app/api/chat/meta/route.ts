import { GET as metaGet } from '@/products/chat/backend/controllers/chatMetaController'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  return metaGet(req)
}
