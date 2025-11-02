import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const documentoId = String(formData.get('documento_id') || '').trim()
    const file = formData.get('file') as File | null
    if (!file) {
      return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })
    }

    // Caminho no bucket
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const originalName = file.name || 'arquivo'
    const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin'
    const rand = Math.random().toString(36).slice(2)
    const basePrefix = documentoId ? documentoId : 'uploads'
    const path = `${basePrefix}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

    // Upload para bucket privado 'documentos'
    const ab = await file.arrayBuffer()
    const { error: uploadError } = await supabase
      .storage
      .from('documentos')
      .upload(path, ab, { contentType: file.type || 'application/octet-stream', upsert: false })
    if (uploadError) {
      console.error('Erro upload storage:', uploadError)
      return Response.json({ success: false, message: 'Falha no upload do arquivo', error: uploadError.message }, { status: 500 })
    }

    // URL assinada opcional para retorno imediato
    const { data: signed } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(path, 60 * 5)

    return Response.json({
      success: true,
      message: 'Upload concluído (storage) ',
      storage_path: path,
      file: {
        nome_arquivo: originalName,
        tipo_arquivo: file.type || null,
        tamanho_bytes: typeof file.size === 'number' ? file.size : null,
      },
      signed_url: signed?.signedUrl
    })
  } catch (error) {
    console.error('Erro upload anexo:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
