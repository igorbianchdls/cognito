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
    const tenant_id = Number(String(form.get('tenant_id') || '').trim())

    if (!view) {
      return Response.json({ success: false, message: 'view é obrigatório' }, { status: 400 })
    }
    if (!file) {
      return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })
    }
    if (!tipo_documento_id || Number.isNaN(tipo_documento_id)) {
      return Response.json({ success: false, message: 'tipo_documento_id é obrigatório' }, { status: 400 })
    }
    if (!tenant_id || Number.isNaN(tenant_id)) {
      return Response.json({ success: false, message: 'tenant_id é obrigatório' }, { status: 400 })
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
          `INSERT INTO documentos.documento (tenant_id, tipo_documento_id, numero, descricao, data_emissao, valor_total, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [tenant_id, tipo_documento_id, numero, descricao, data_emissao, valor_total, status]
        )
        const inserted = docInsert.rows[0] as { id: number | string }
        const documento_id = Number(inserted?.id)
        if (!documento_id) throw new Error('Falha ao criar documento')

        // 2) Inserir registro por domínio
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
        } else if (view === 'financeiro') {
          const meio_pagamento = String(form.get('meio_pagamento') || '').trim() || null
          const banco_id_raw = String(form.get('banco_id') || '').trim()
          const banco_id = banco_id_raw ? Number(banco_id_raw) : null
          const codigo_barras = String(form.get('codigo_barras') || '').trim() || null
          const data_liquidacao = String(form.get('data_liquidacao') || '').trim() || null
          const valor_pago_raw = String(form.get('valor_pago') || '').trim()
          const valor_pago = valor_pago_raw ? Number(valor_pago_raw) : null

          await client.query(
            `INSERT INTO documentos.documentos_financeiros (documento_id, meio_pagamento, banco_id, codigo_barras, data_liquidacao, valor_pago)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [documento_id, meio_pagamento, banco_id, codigo_barras, data_liquidacao, valor_pago]
          )
        } else if (view === 'operacional') {
          const responsavel_id_raw = String(form.get('responsavel_id') || '').trim()
          const responsavel_id = responsavel_id_raw ? Number(responsavel_id_raw) : null
          const local_execucao = String(form.get('local_execucao') || '').trim() || null
          const data_execucao = String(form.get('data_execucao') || '').trim() || null
          const checklist_json = String(form.get('checklist_json') || '').trim() || null
          const observacoes = String(form.get('observacoes') || '').trim() || null

          await client.query(
            `INSERT INTO documentos.documentos_operacionais (documento_id, responsavel_id, local_execucao, data_execucao, checklist_json, observacoes)
             VALUES ($1, $2, $3, $4, COALESCE($5::jsonb, NULL), $6)`,
            [documento_id, responsavel_id, local_execucao, data_execucao, checklist_json, observacoes]
          )
        } else if (view === 'juridico' || view === 'rh') {
          // Sem tabela de domínio específica no código atual; mantém apenas o documento + anexo
        } else if (view === 'contratos') {
          const data_inicio = String(form.get('data_inicio') || '').trim() || null
          const data_fim = String(form.get('data_fim') || '').trim() || null
          const prazo_meses_raw = String(form.get('prazo_meses') || '').trim()
          const prazo_meses = prazo_meses_raw ? Number(prazo_meses_raw) : null
          const renovacao_automatica_raw = String(form.get('renovacao_automatica') || '').trim().toLowerCase()
          const renovacao_automatica = renovacao_automatica_raw ? (['1','true','t','yes','y','sim','s'].includes(renovacao_automatica_raw) ? true : false) : null
          const valor_mensal_raw = String(form.get('valor_mensal') || '').trim()
          const valor_mensal = valor_mensal_raw ? Number(valor_mensal_raw) : null
          const objeto = String(form.get('objeto') || '').trim() || null
          const clausulas_json = String(form.get('clausulas_json') || '').trim() || null

          await client.query(
            `INSERT INTO documentos.documentos_contratos (documento_id, data_inicio, data_fim, prazo_meses, renovacao_automatica, valor_mensal, objeto, clausulas_json)
             VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::jsonb, NULL))`,
            [documento_id, data_inicio, data_fim, prazo_meses, renovacao_automatica, valor_mensal, objeto, clausulas_json]
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
