import { createClient } from '@supabase/supabase-js'
import { runQuery } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(String(searchParams.get('id') || '').trim())
    if (!id || Number.isNaN(id)) {
      return Response.json({ success: false, message: 'id é obrigatório' }, { status: 400 })
    }

    const rows = await runQuery<{ arquivo_url: string }>(
      `SELECT arquivo_url FROM documentos.documentos_anexos WHERE id = $1 LIMIT 1`,
      [id]
    )
    const data = rows?.[0]
    if (!data?.arquivo_url) {
      return Response.json({ success: false, message: 'Anexo não encontrado' }, { status: 404 })
    }

    await supabase.storage.from('documentos').remove([data.arquivo_url as string]).catch(() => {})
    await runQuery(`DELETE FROM documentos.documentos_anexos WHERE id = $1`, [id])

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
