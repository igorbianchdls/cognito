import { runQuery } from '@/lib/postgres'

export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitRaw = Number(String(searchParams.get('limit') ?? '').trim())
    const limit = !Number.isNaN(limitRaw) && limitRaw > 0 && limitRaw <= 1000 ? limitRaw : 100

    const rows = await runQuery<Record<string, unknown>>(
      `SELECT a.id, a.documento_id, a.nome_arquivo, a.tipo_arquivo, a.arquivo_url, a.tamanho_bytes, a.criado_em
         FROM documentos.documentos_anexos a
         JOIN documentos.documentos_financeiros f ON f.documento_id = a.documento_id
        ORDER BY a.criado_em DESC NULLS LAST, a.id DESC
        LIMIT $1`,
      [limit]
    )
    return Response.json({ success: true, rows, limit })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

