import { createClient } from '@supabase/supabase-js'
import { runQuery } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((p) => p === 'lancamentos')
    const idStr = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : ''
    const id = Number(idStr)
    if (!id || Number.isNaN(id)) {
      return Response.json({ success: false, message: 'id inválido' }, { status: 400 })
    }

    const rows = await runQuery<{ storage_key: string | null; nome_arquivo: string | null }>(
      `SELECT storage_key, nome_arquivo FROM financeiro.lancamentos_financeiros WHERE id = $1 LIMIT 1`,
      [id]
    )
    const row = rows?.[0]
    if (!row || !row.storage_key) {
      return Response.json({ success: false, message: 'Arquivo não encontrado' }, { status: 404 })
    }

    const { data, error } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(row.storage_key, 60 * 5, { download: (row.nome_arquivo || 'arquivo') })
    if (error) {
      return Response.json({ success: false, message: 'Falha ao assinar URL', error: error.message }, { status: 500 })
    }
    return Response.json({ success: true, url: data?.signedUrl })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json({ success: false, message: msg }, { status: 500 })
  }
}
