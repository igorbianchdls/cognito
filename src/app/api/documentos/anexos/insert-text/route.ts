import { runQuery } from '@/lib/postgres'

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const documento_id_raw = body?.documento_id
    const nome_arquivo_raw = body?.nome_arquivo
    const tipo_arquivo_raw = body?.tipo_arquivo
    const arquivo_url_raw = body?.arquivo_url

    const documento_id = Number(documento_id_raw)
    const nome_arquivo = typeof nome_arquivo_raw === 'string' ? nome_arquivo_raw.trim() : ''
    const tipo_arquivo = typeof tipo_arquivo_raw === 'string' ? tipo_arquivo_raw.trim() : ''
    const arquivo_url = typeof arquivo_url_raw === 'string' ? arquivo_url_raw.trim() : ''

    if (!documento_id || Number.isNaN(documento_id)) {
      return Response.json({ success: false, message: 'documento_id é obrigatório e deve ser numérico' }, { status: 400 })
    }
    if (!nome_arquivo) {
      return Response.json({ success: false, message: 'nome_arquivo é obrigatório' }, { status: 400 })
    }
    if (!tipo_arquivo) {
      return Response.json({ success: false, message: 'tipo_arquivo é obrigatório' }, { status: 400 })
    }
    if (!arquivo_url) {
      return Response.json({ success: false, message: 'arquivo_url é obrigatório' }, { status: 400 })
    }

    const rows = await runQuery(
      `INSERT INTO documentos.documentos_anexos (documento_id, nome_arquivo, tipo_arquivo, arquivo_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, documento_id, nome_arquivo, tipo_arquivo, arquivo_url, tamanho_bytes, criado_em`,
      [documento_id, nome_arquivo, tipo_arquivo, arquivo_url]
    )
    return Response.json({ success: true, anexo: rows?.[0] ?? null })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
