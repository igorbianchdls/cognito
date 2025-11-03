import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const arquivo_url = typeof body?.arquivo_url === 'string' ? body.arquivo_url.trim() : ''

    if (!arquivo_url) {
      return Response.json({ success: false, message: 'arquivo_url é obrigatório' }, { status: 400 })
    }

    // Inserção mínima para teste. Outros campos ficam nulos, conforme permissões/constraints da tabela.
    const { data, error } = await supabase
      .schema('documentos')
      .from('documentos_anexos')
      .insert([{ 
        arquivo_url,
        documento_id: null,
        nome_arquivo: null,
        tipo_arquivo: null,
        tamanho_bytes: null,
      }])
      .select()

    if (error) {
      return Response.json({ success: false, message: 'Falha ao inserir em documentos_anexos', error: error.message }, { status: 500 })
    }

    return Response.json({ success: true, anexo: data?.[0] ?? null })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

