import { createClient } from '@supabase/supabase-js'
import { runQuery } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const documentoId = Number(String(form.get('documento_id') || '').trim())
    const file = form.get('file') as File | null

    if (!documentoId || Number.isNaN(documentoId)) {
      return Response.json({ success: false, message: 'documento_id é obrigatório' }, { status: 400 })
    }
    if (!file) {
      return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })
    }

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const originalName = file.name || 'arquivo'
    const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin'
    const rand = Math.random().toString(36).slice(2)
    // Padroniza o caminho dentro do bucket 'documentos': sem prefixo 'documentos/' duplicado
    const storagePath = `financeiro/${documentoId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

    const ab = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, ab, { contentType: file.type || 'application/octet-stream', upsert: false })
    if (uploadError) {
      return Response.json({ success: false, message: 'Falha no upload', error: uploadError.message }, { status: 500 })
    }

    try {
      const rows = await runQuery(
        `INSERT INTO documentos.documentos_anexos (documento_id, nome_arquivo, tipo_arquivo, arquivo_url, tamanho_bytes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, documento_id, nome_arquivo, tipo_arquivo, arquivo_url, tamanho_bytes, criado_em`,
        [
          documentoId,
          originalName,
          file.type || null,
          storagePath,
          typeof file.size === 'number' ? file.size : null,
        ]
      )
      const inserted = rows?.[0] || null
      // Retorna URL assinada já no upload
      const { data: signed, error: signError } = await supabase
        .storage
        .from('documentos')
        .createSignedUrl(storagePath, 60 * 5)
      const signed_url = signError ? undefined : signed?.signedUrl
      return Response.json({ success: true, anexo: inserted, signed_url })
    } catch (e) {
      await supabase.storage.from('documentos').remove([storagePath]).catch(() => {})
      const msg = e instanceof Error ? e.message : String(e)
      return Response.json({ success: false, message: 'Falha ao gravar metadados', error: msg }, { status: 500 })
    }
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
