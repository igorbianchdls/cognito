import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const documentoId = String(formData.get('documento_id') || '').trim()
    const file = formData.get('file') as File | null

    if (!documentoId) {
      return Response.json({ success: false, message: 'documento_id é obrigatório' }, { status: 400 })
    }
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
    const path = `${documentoId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

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

    // Inserir metadados na tabela documentos.documentos_anexos
    const { data: inserted, error: insertError } = await supabase
      .from('documentos.documentos_anexos')
      .insert([{
        documento_id: Number(documentoId),
        nome_arquivo: originalName,
        tipo_arquivo: file.type || null,
        arquivo_url: path, // armazenamos o caminho no storage
        tamanho_bytes: (file as any).size ?? null,
      }])
      .select()

    if (insertError) {
      console.error('Erro insert anexos:', insertError)
      // tentar remover do storage
      await supabase.storage.from('documentos').remove([path]).catch(() => {})
      return Response.json({ success: false, message: 'Falha ao gravar metadados', error: insertError.message }, { status: 500 })
    }

    // URL assinada opcional para retorno imediato
    const { data: signed } = await supabase
      .storage
      .from('documentos')
      .createSignedUrl(path, 60 * 5)

    return Response.json({ success: true, message: 'Upload concluído', anexo: inserted?.[0], signed_url: signed?.signedUrl })
  } catch (error) {
    console.error('Erro upload anexo:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

