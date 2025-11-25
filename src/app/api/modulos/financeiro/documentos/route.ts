import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lancamentoIdRaw = String(searchParams.get('lancamento_id') || '').trim()
    const lancamento_id = Number(lancamentoIdRaw)
    if (!lancamento_id || Number.isNaN(lancamento_id)) {
      return Response.json({ success: false, message: 'lancamento_id é obrigatório' }, { status: 400 })
    }

    const rows = await runQuery<Record<string, unknown>>(
      `SELECT 
         d.id AS documento_id,
         df.id AS doc_financeiro_id,
         a.id AS anexo_id,
         a.nome_arquivo,
         a.tipo_arquivo,
         a.arquivo_url,
         a.tamanho_bytes,
         a.criado_em
       FROM documentos.documentos_financeiros df
       JOIN documentos.documento d ON d.id = df.documento_id
       LEFT JOIN documentos.documentos_anexos a ON a.documento_id = d.id
      WHERE df.lancamento_id = $1
      ORDER BY a.criado_em DESC NULLS LAST, a.id DESC`,
      [lancamento_id]
    )

    return Response.json({ success: true, rows })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json({ success: false, message: msg }, { status: 500 })
  }
}

