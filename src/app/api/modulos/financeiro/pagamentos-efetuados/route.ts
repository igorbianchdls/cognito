import { withTransaction } from '@/lib/postgres'
import { inngest } from '@/lib/inngest'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const ct = req.headers.get('content-type') || ''
    // JSON commit path (preview → criar) — novo schema (pagamentos_efetuados + linhas)
    if (ct.includes('application/json')) {
      const body = await req.json() as {
        lancamento_origem_id: string
        conta_financeira_id: string
        metodo_pagamento_id: string
        descricao: string
        numero_pagamento?: string
      }
      const apId = Number(body.lancamento_origem_id)
      if (!apId || !body.conta_financeira_id || !body.metodo_pagamento_id || !body.descricao) {
        return Response.json({ success: false, message: 'lancamento_origem_id, conta_financeira_id, metodo_pagamento_id e descricao são obrigatórios' }, { status: 400 })
      }

      const result = await withTransaction(async (client) => {
        // 1) Buscar AP (novo schema) e soma de pagamentos já efetuados
        const apRow = await client.query(
          `SELECT cp.id, cp.tenant_id, cp.valor_liquido::numeric AS total, cp.fornecedor_id, cp.categoria_despesa_id, cp.status
             FROM financeiro.contas_pagar cp
            WHERE cp.id = $1
            LIMIT 1`,
          [apId]
        )
        if (!apRow.rows || apRow.rows.length === 0) throw new Error('Conta a pagar não encontrada')
        const ap = apRow.rows[0] as { id: number; tenant_id: number | null; total: number; fornecedor_id: number | null; categoria_despesa_id: number | null; status: string | null }

        const pagosRow = await client.query(
          `SELECT COALESCE(SUM(pel.valor_pago),0)::numeric AS pagos
             FROM financeiro.pagamentos_efetuados_linhas pel
            WHERE pel.conta_pagar_id = $1`,
          [apId]
        )
        const pagos: number = Number(pagosRow.rows[0]?.pagos || 0)
        const pendente = Math.max(0, Number(ap.total || 0) - pagos)
        if (pendente <= 0) throw new Error('Título já está totalmente pago')

        const today = new Date().toISOString().slice(0, 10)
        const numero_pagamento = (body.numero_pagamento && String(body.numero_pagamento).trim()) || `PE-${today.replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
        const tenant = ap.tenant_id ?? 1
        // 2) Criar cabeçalho do pagamento (novo schema)
        const insHeader = await client.query(
          `INSERT INTO financeiro.pagamentos_efetuados (
             tenant_id, numero_pagamento, status, data_pagamento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_pagamento, observacao
           ) VALUES ($1, $2, 'pago', $3, $3, $4, $5, $6, $7)
           RETURNING id`,
          [tenant, numero_pagamento, today, Number(body.conta_financeira_id), Number(body.metodo_pagamento_id), Math.abs(pendente), `Pagamento AP #${apId} - ${body.descricao}`.slice(0,255)]
        )
        const pagamentoId = Number(insHeader.rows[0]?.id)
        if (!pagamentoId) throw new Error('Falha ao criar pagamento efetuado')

        // 3) Inserir linha vinculando à AP
        await client.query(
          `INSERT INTO financeiro.pagamentos_efetuados_linhas (
             pagamento_id, conta_pagar_id, valor_original_documento, valor_pago, saldo_apos_pagamento, desconto_financeiro, juros, multa
           ) VALUES ($1,$2,$3,$4,$5,0,0,0)`,
          [pagamentoId, apId, Number(ap.total || 0), Math.abs(pendente), Math.max(0, Number(ap.total || 0) - (pagos + Math.abs(pendente)))]
        )

        // 4) Atualizar status da AP
        const pagos2Row = await client.query(
          `SELECT COALESCE(SUM(pel.valor_pago),0)::numeric AS pagos
             FROM financeiro.pagamentos_efetuados_linhas pel
            WHERE pel.conta_pagar_id = $1`,
          [apId]
        )
        const pagos2: number = Number(pagos2Row.rows[0]?.pagos || 0)
        const novoStatus = pagos2 >= Number(ap.total || 0) ? 'pago' : (pagos2 > 0 ? 'parcial' : 'pendente')
        await client.query(`UPDATE financeiro.contas_pagar SET status = $1 WHERE id = $2`, [novoStatus, apId])

        // 5) Montar resposta completa (detalhes)
        const cfRow = await client.query(`SELECT nome_conta FROM financeiro.contas_financeiras WHERE id = $1`, [Number(body.conta_financeira_id)])
        const mpRow = await client.query(`SELECT nome FROM financeiro.metodos_pagamento WHERE id = $1`, [Number(body.metodo_pagamento_id)])
        const fornNameRow = ap.fornecedor_id ? await client.query(`SELECT nome_fantasia AS nome FROM entidades.fornecedores WHERE id = $1`, [ap.fornecedor_id]) : { rows: [] as Record<string, unknown>[] }

        const conta_financeira_nome = String(cfRow.rows?.[0]?.nome_conta || `Conta #${body.conta_financeira_id}`)
        const forma_pagamento_nome = String(mpRow.rows?.[0]?.nome || `Método #${body.metodo_pagamento_id}`)
        const fornecedor_nome = String(fornNameRow.rows?.[0]?.nome || '-')

        const valor_formatado = Math.abs(pendente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        return {
          id: pagamentoId,
          response: {
            success: true,
            data: {
              id: String(pagamentoId),
              conta_pagar_id: String(apId),
              valor_pago: Math.abs(pendente),
              valor_juros: 0,
              valor_multa: 0,
              valor_desconto: 0,
              valor_total: Math.abs(pendente),
              data_pagamento: today,
              forma_pagamento: forma_pagamento_nome,
              conta_financeira_id: String(body.conta_financeira_id),
              conta_financeira_nome,
              observacoes: body.descricao,
              status: 'pago',
              data_cadastro: new Date().toISOString(),
              conta_pagar: {
                numero_nota_fiscal: '-',
                fornecedor_nome,
                valor_original: Number(ap.total || 0),
                status_anterior: ap.status || 'pendente',
                status_atual: novoStatus,
              },
            },
            message: `Pagamento efetuado com sucesso! Conta a pagar baixada automaticamente.`,
            title: '💸 Pagamento Efetuado',
            resumo: {
              id: String(pagamentoId),
              valor_formatado,
              data_pagamento: today,
              forma_pagamento: forma_pagamento_nome,
              conta_financeira: conta_financeira_nome,
              nota_fiscal: '-',
              fornecedor: fornecedor_nome,
              status_conta: novoStatus,
            },
            detalhamento: {
              valor_principal: Math.abs(pendente),
              juros: 0,
              multa: 0,
              desconto: 0,
              total: Math.abs(pendente),
            }
          }
        }
      })

      if (!result) throw new Error('Falha ao criar pagamento efetuado')
      // Dispara evento Inngest para criação do LC
      try {
        await inngest.send({ name: 'financeiro/pagamentos_efetuados/criado', data: { pagamento_id: result.id } })
      } catch (e) {
        console.warn('Falha ao enviar evento Inngest pagamentos_efetuados.criado', e)
      }
      return Response.json(result.response)
    }

    // FormData — criar somente cabeçalho (novo schema), sem vincular AP
    const form = await req.formData()
    const descricao = String(form.get('descricao') || '').trim()
    const valorRaw = String(form.get('valor') || '').trim()
    const data_lancamento = String(form.get('data_lancamento') || '').trim()
    const numero_pagamento_form = String(form.get('numero_pagamento') || '').trim()
    if (!descricao) return Response.json({ success: false, message: 'descricao é obrigatório' }, { status: 400 })
    if (!valorRaw) return Response.json({ success: false, message: 'valor é obrigatório' }, { status: 400 })
    if (!data_lancamento) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })

    const valor = Number(valorRaw)
    if (Number.isNaN(valor)) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

    const tenant_id_raw = String(form.get('tenant_id') || '').trim()
    const entidade_id_raw = String(form.get('entidade_id') || '').trim() // fornecedor (não usado no header)
    const categoria_id_raw = String(form.get('categoria_id') || '').trim() // não usado no header
    const conta_financeira_id_raw = String(form.get('conta_financeira_id') || '').trim()
    const status = String(form.get('status') || '').trim() || null

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    const entidade_id = entidade_id_raw ? Number(entidade_id_raw) : null
    const categoria_id = categoria_id_raw ? Number(categoria_id_raw) : null
    const conta_financeira_id = conta_financeira_id_raw ? Number(conta_financeira_id_raw) : null

    const result = await withTransaction(async (client) => {
      const numero_pagamento = numero_pagamento_form || `PE-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,8).toUpperCase()}`
      const insert = await client.query(
        `INSERT INTO financeiro.pagamentos_efetuados (
           tenant_id, numero_pagamento, status, data_pagamento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_pagamento, observacao
         ) VALUES ($1, $2, COALESCE($3,'pago'), $4, $4, $5, NULL, $6, $7)
         RETURNING id`,
        [tenant_id, numero_pagamento, status, data_lancamento, conta_financeira_id, Math.abs(valor), descricao]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar pagamento efetuado')
      return { id }
    })

    // Dispara evento Inngest também para modo FormData
    try {
      await inngest.send({ name: 'financeiro/pagamentos_efetuados/criado', data: { pagamento_id: result.id } })
    } catch (e) {
      console.warn('Falha ao enviar evento Inngest (FormData) pagamentos_efetuados.criado', e)
    }
    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/pagamentos-efetuados POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
