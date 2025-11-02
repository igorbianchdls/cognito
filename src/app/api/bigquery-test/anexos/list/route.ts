import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export const maxDuration = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const documentoId = searchParams.get('documento_id')
    const page = Number(searchParams.get('page') || '1')
    const pageSize = Math.min(200, Number(searchParams.get('pageSize') || '50'))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('documentos.documentos_anexos')
      .select('*', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(from, to)

    if (documentoId) {
      query = query.eq('documento_id', Number(documentoId))
    }

    const { data, error, count } = await query
    if (error) {
      console.error('Erro list anexos:', error)
      return Response.json({ success: false, message: 'Falha ao listar anexos', error: error.message }, { status: 500 })
    }

    // Assinar URLs
    const rows = await Promise.all((data || []).map(async (r: any) => {
      if (r.arquivo_url) {
        const { data: signed } = await supabase
          .storage
          .from('documentos')
          .createSignedUrl(r.arquivo_url, 60 * 5)
        return { ...r, signed_url: signed?.signedUrl }
      }
      return r
    }))

    return Response.json({ success: true, rows, total: count || rows.length, page, pageSize })
  } catch (error) {
    console.error('Erro list anexos:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

