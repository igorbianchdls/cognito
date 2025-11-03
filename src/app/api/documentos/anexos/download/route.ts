import { createClient } from '@supabase/supabase-js'
import { runQuery } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(String(searchParams.get('id') || '').trim())
    const mode = String(searchParams.get('mode') || '').trim().toLowerCase()
    if (!id || Number.isNaN(id)) {
      return Response.json({ success: false, message: 'id é obrigatório' }, { status: 400 })
    }

    const rows = await runQuery<{ arquivo_url: string; nome_arquivo?: string }>(
      `SELECT arquivo_url, nome_arquivo FROM documentos.documentos_anexos WHERE id = $1 LIMIT 1`,
      [id]
    )
    const data = rows?.[0]

    if (!data?.arquivo_url) {
      return Response.json({ success: false, message: 'Anexo não encontrado' }, { status: 404 })
    }

    const downloadName = typeof data.nome_arquivo === 'string' && data.nome_arquivo.trim() ? data.nome_arquivo : 'arquivo'
    const options = mode === 'download' ? { download: downloadName } : undefined
    const { data: signed, error: signError } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(data.arquivo_url, 60 * 5, options)

    if (signError) {
      return Response.json({ success: false, message: 'Falha ao assinar URL', error: signError.message }, { status: 500 })
    }

    return Response.json({ success: true, url: signed?.signedUrl })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
