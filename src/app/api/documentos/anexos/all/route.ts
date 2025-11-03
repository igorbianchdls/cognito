import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limitRaw = Number(String(searchParams.get('limit') ?? '').trim())
    const limit = !Number.isNaN(limitRaw) && limitRaw > 0 && limitRaw <= 1000 ? limitRaw : 100

    const { data, error } = await supabase
      .schema('documentos')
      .from('documentos_anexos')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limit)

    if (error) {
      return Response.json({ success: false, message: 'Falha ao listar documentos_anexos', error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, rows: data ?? [], limit })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

