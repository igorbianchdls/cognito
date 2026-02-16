import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  return Response.json(
    { success: false, message: 'Campanhas não implementadas no schema atual (MVP CRM).' },
    { status: 501 }
  )
}
