import { PATCH as patchById, DELETE as deleteById } from '@/products/chat/backend/controllers/chatByIdController'

export const runtime = 'nodejs'

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  return patchById(req as any, context)
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  return deleteById(req as any, context)
}
