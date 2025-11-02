import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const documentoId = Number(String(searchParams.get('documento_id') || '').trim())
    if (!documentoId || Number.isNaN(documentoId)) {
      return Response.json({ success: false, message: 'documento_id é obrigatório' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('documentos.documentos_anexos')
      .select('*')
      .eq('documento_id', documentoId)
      .order('criado_em', { ascending: false })

    if (error) {
      return Response.json({ success: false, message: 'Falha ao listar', error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, rows: data || [] })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

