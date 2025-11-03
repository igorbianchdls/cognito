import { runQuery } from '@/lib/postgres'

export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const documentoId = Number(String(searchParams.get('documento_id') || '').trim())
    if (!documentoId || Number.isNaN(documentoId)) {
      return Response.json({ success: false, message: 'documento_id é obrigatório' }, { status: 400 })
    }

    const rows = await runQuery<Record<string, unknown>>(
      `SELECT id, documento_id, nome_arquivo, tipo_arquivo, arquivo_url, tamanho_bytes, criado_em
         FROM documentos.documentos_anexos
        WHERE documento_id = $1
        ORDER BY criado_em DESC NULLS LAST, id DESC`,
      [documentoId]
    )
    return Response.json({ success: true, rows })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
