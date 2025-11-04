import { createClient } from '@supabase/supabase-js'
import { withTransaction } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const view = String(form.get('view') || '').trim().toLowerCase()
    const file = form.get('file') as File | null
    const tipo_documento_id = Number(String(form.get('tipo_documento_id') || '').trim())

    if (!view) {
      return Response.json({ success: false, message: 'view é obrigatório' }, { status: 400 })
    }
    if (!file) {
      return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })
    }
    if (!tipo_documento_id || Number.isNaN(tipo_documento_id)) {
      return Response.json({ success: false, message: 'tipo_documento_id é obrigatório' }, { status: 400 })
    }

    // Campos do documento principal
    const numero = String(form.get('numero') || '').trim() || null
    const descricao = String(form.get('descricao') || '').trim() || null
    const data_emissao = String(form.get('data_emissao') || '').trim() || null
    const valor_total_raw = String(form.get('valor_total') || '').trim()
    const valor_total = valor_total_raw ? Number(valor_total_raw) : null
    const status = String(form.get('status') || '').trim() || null

    // Início da transação
    let uploadedPath: string | null = null
    try {
      const result = await withTransaction(async (client) => {
        // 1) Inserir documento
        const docInsert = await client.query(
          `INSERT INTO documentos.documento (tipo_documento_id, numero, descricao, data_emissao, valor_total, status)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [tipo_documento_id, numero, descricao, data_emissao, valor_total, status]
        )
        const documento_id: number = docInsert.rows[0]?.id
        if (!documento_id) throw new Error('Falha ao criar documento')

        // 2) Inserir registro por domínio (apenas fiscal nesta etapa)
        if (view === 'fiscal') {
          const cfop = String(form.get('cfop') || '').trim() || null
          const chave_acesso = String(form.get('chave_acesso') || '').trim() || null
          const natureza_operacao = String(form.get('natureza_operacao') || '').trim() || null
          const modelo = String(form.get('modelo') || '').trim() || null
          const serie = String(form.get('serie') || '').trim() || null
          const data_autorizacao = String(form.get('data_autorizacao') || '').trim() || null
          const ambiente = String(form.get('ambiente') || '').trim() || null
          await client.query(
            `INSERT INTO documentos.documentos_fiscais (documento_id, cfop, chave_acesso, natureza_operacao, modelo, serie, data_autorizacao, ambiente)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [documento_id, cfop, chave_acesso, natureza_operacao, modelo, serie, data_autorizacao, ambiente]
          )
        } else {
          throw new Error(`View não suportada: ${view}`)
        }

        // 3) Upload para Storage
        const now = new Date()
        const yyyy = now.getFullYear()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const originalName = file.name || 'arquivo'
        const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin'
        const rand = Math.random().toString(36).slice(2)
        const storagePath = `${view}/${documento_id}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

        const ab = await file.arrayBuffer()
        const { error: uploadError } = await supabase.storage
          .from('documentos')
          .upload(storagePath, ab, { contentType: file.type || 'application/octet-stream', upsert: false })
        if (uploadError) {
          throw new Error(`Falha no upload: ${uploadError.message}`)
        }
        uploadedPath = storagePath

        // 4) Inserir anexo
        await client.query(
          `INSERT INTO documentos.documentos_anexos (documento_id, nome_arquivo, tipo_arquivo, arquivo_url, tamanho_bytes)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            documento_id,
            originalName,
            file.type || null,
            storagePath,
            typeof file.size === 'number' ? file.size : null,
          ]
        )

        return { documento_id }
      })

      return Response.json({ success: true, documento_id: result.documento_id })
    } catch (err) {
      // Se upload foi feito, tentar limpar
      if (uploadedPath) {
        await supabase.storage.from('documentos').remove([uploadedPath]).catch(() => {})
      }
      const msg = err instanceof Error ? err.message : String(err)
      return Response.json({ success: false, message: msg }, { status: 400 })
    }
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

