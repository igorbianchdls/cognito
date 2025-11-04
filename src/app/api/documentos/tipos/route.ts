import { runQuery } from '@/lib/postgres'

export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const categoria = (searchParams.get('categoria') || '').trim().toLowerCase()

    const params: unknown[] = []
    let where = ''
    if (categoria) {
      where = 'WHERE LOWER(categoria) = $1'
      params.push(categoria)
    }

    const rows = await runQuery<{ id: number; nome: string; categoria?: string }>(
      `SELECT id, nome, categoria FROM documentos.tipos_documentos ${where} ORDER BY nome ASC`,
      params
    )
    return Response.json({ success: true, rows })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

