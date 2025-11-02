import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const domain = String(form.get('domain') || '').trim().toLowerCase()
    const domainId = Number(String(form.get('domain_id') || '').trim())
    const file = form.get('file') as File | null

    if (!domain || !domainId || Number.isNaN(domainId)) {
      return Response.json({ success: false, message: 'domain e domain_id são obrigatórios' }, { status: 400 })
    }
    if (!file) {
      return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })
    }

    let documentoId: number | null = null
    if (domain === 'financeiro') {
      // Buscar documento_id diretamente da tabela de domínio
      const { data, error } = await supabase
        .schema('documentos')
        .from('documentos_financeiros')
        .select('documento_id')
        .eq('id', domainId)
        .single()
      if (error || !data?.documento_id) {
        return Response.json({ success: false, message: 'Não foi possível resolver documento_id a partir de domain_id', error: error?.message }, { status: 400 })
      }
      documentoId = Number(data.documento_id)
    } else {
      return Response.json({ success: false, message: `Domínio não suportado: ${domain}` }, { status: 400 })
    }

    // Upload para Storage
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const originalName = file.name || 'arquivo'
    const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin'
    const rand = Math.random().toString(36).slice(2)
    const storagePath = `documentos/${domain}/${documentoId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

    const ab = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, ab, { contentType: file.type || 'application/octet-stream', upsert: false })
    if (uploadError) {
      return Response.json({ success: false, message: 'Falha no upload', error: uploadError.message }, { status: 500 })
    }

    // Inserir metadados
    const { data: inserted, error: insertError } = await supabase
      .schema('documentos')
      .from('documentos_anexos')
      .insert([{ 
        documento_id: documentoId,
        nome_arquivo: originalName,
        tipo_arquivo: file.type || null,
        arquivo_url: storagePath,
        tamanho_bytes: typeof file.size === 'number' ? file.size : null,
      }])
      .select()
    if (insertError) {
      // rollback storage
      await supabase.storage.from('documentos').remove([storagePath]).catch(() => {})
      return Response.json({ success: false, message: 'Falha ao gravar metadados', error: insertError.message }, { status: 500 })
    }

    return Response.json({ success: true, anexo: inserted?.[0] })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

