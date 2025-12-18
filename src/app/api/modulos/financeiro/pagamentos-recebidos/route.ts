import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const ct = req.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = await req.json() as {
        lancamento_origem_id: string
        conta_financeira_id: string
        metodo_pagamento_id: string
        descricao: string
      }
      const arId = Number(body.lancamento_origem_id)
      if (!arId || !body.conta_financeira_id || !body.metodo_pagamento_id || !body.descricao) {
        return Response.json({ success: false, message: 'lancamento_origem_id, conta_financeira_id, metodo_pagamento_id e descricao são obrigatórios' }, { status: 400 })
      }

      const result = await withTransaction(async (client) => {
        // 1) Buscar AR (novo schema) e recebimentos já registrados
        const arRow = await client.query(
          `SELECT cr.id, cr.tenant_id, cr.valor_liquido::numeric AS total, cr.cliente_id, cr.categoria_financeira_id, cr.status
             FROM financeiro.contas_receber cr
            WHERE cr.id = $1
            LIMIT 1`,
          [arId]
        )
        if (!arRow.rows || arRow.rows.length === 0) throw new Error('Conta a receber não encontrada')
        const ar = arRow.rows[0] as { id: number; tenant_id: number | null; total: number; cliente_id: number | null; categoria_financeira_id: number | null; status: string | null }

        const recRow = await client.query(
          `SELECT COALESCE(SUM(prl.valor_recebido),0)::numeric AS recebidos
             FROM financeiro.pagamentos_recebidos_linhas prl
            WHERE prl.conta_receber_id = $1`,
          [arId]
        )
        const recebidos: number = Number(recRow.rows[0]?.recebidos || 0)
        const pendente = Math.max(0, Number(ar.total || 0) - recebidos)
        if (pendente <= 0) throw new Error('Título já está totalmente recebido')

        const today = new Date().toISOString().slice(0, 10)
        const tenant = ar.tenant_id ?? 1
        // 2) Criar cabeçalho do recebimento (novo schema)
        const insHeader = await client.query(
          `INSERT INTO financeiro.pagamentos_recebidos (
             tenant_id, status, data_recebimento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_recebido, observacao
           ) VALUES ($1, 'recebido', $2, $2, $3, $4, $5, $6)
           RETURNING id`,
          [tenant, today, Number(body.conta_financeira_id), Number(body.metodo_pagamento_id), Math.abs(pendente), `Recebimento AR #${arId} - ${body.descricao}`.slice(0, 255)]
        )
        const recebId = Number(insHeader.rows[0]?.id)
        if (!recebId) throw new Error('Falha ao criar pagamento recebido')

        // 3) Inserir linha vinculando à AR
        await client.query(
          `INSERT INTO financeiro.pagamentos_recebidos_linhas (
             pagamento_id, conta_receber_id, valor_original_documento, valor_recebido, saldo_apos_pagamento, desconto_financeiro, juros, multa
           ) VALUES ($1,$2,$3,$4,$5,0,0,0)`,
          [recebId, arId, Number(ar.total || 0), Math.abs(pendente), Math.max(0, Number(ar.total || 0) - (recebidos + Math.abs(pendente)))]
        )

        // 4) Atualizar status da AR
        const rec2Row = await client.query(
          `SELECT COALESCE(SUM(prl.valor_recebido),0)::numeric AS recebidos
             FROM financeiro.pagamentos_recebidos_linhas prl
            WHERE prl.conta_receber_id = $1`,
          [arId]
        )
        const rec2: number = Number(rec2Row.rows[0]?.recebidos || 0)
        const novoStatus = rec2 >= Number(ar.total || 0) ? 'recebido' : (rec2 > 0 ? 'parcial' : 'pendente')
        await client.query(`UPDATE financeiro.contas_receber SET status = $1 WHERE id = $2`, [novoStatus, arId])

        // 5) Montar resposta
        const cfRow = await client.query(`SELECT nome_conta FROM financeiro.contas_financeiras WHERE id = $1`, [Number(body.conta_financeira_id)])
        const mpRow = await client.query(`SELECT nome FROM financeiro.metodos_pagamento WHERE id = $1`, [Number(body.metodo_pagamento_id)])
        const cliNameRow = ar.cliente_id ? await client.query(`SELECT nome_fantasia FROM entidades.clientes WHERE id = $1`, [ar.cliente_id]) : { rows: [] as Record<string, unknown>[] }

        const conta_financeira_nome = String(cfRow.rows?.[0]?.nome_conta || `Conta #${body.conta_financeira_id}`)
        const forma_pagamento_nome = String(mpRow.rows?.[0]?.nome || `Método #${body.metodo_pagamento_id}`)
        const cliente_nome = String(cliNameRow.rows?.[0]?.nome_fantasia || '-')
        const valor_formatado = Math.abs(pendente).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

        return {
          response: {
            success: true,
            data: {
              id: String(recebId),
              conta_receber_id: String(arId),
              valor_recebido: Math.abs(pendente),
              valor_juros: 0,
              valor_multa: 0,
              valor_desconto: 0,
              valor_total: Math.abs(pendente),
              data_recebimento: today,
              forma_pagamento: forma_pagamento_nome,
              conta_financeira_id: String(body.conta_financeira_id),
              conta_financeira_nome,
              observacoes: body.descricao,
              status: 'recebido',
              data_cadastro: new Date().toISOString(),
              conta_receber: {
                numero_nota_fiscal: '-',
                cliente_nome,
                valor_original: Number(ar.total || 0),
                status_anterior: ar.status || 'pendente',
                status_atual: novoStatus,
              }
            },
            message: 'Pagamento recebido com sucesso! Conta a receber baixada automaticamente.',
            title: '💰 Pagamento Recebido',
            resumo: {
              id: String(recebId),
              valor_formatado,
              data_recebimento: today,
              forma_pagamento: forma_pagamento_nome,
              conta_financeira: conta_financeira_nome,
              nota_fiscal: '-',
              cliente: cliente_nome,
              status_conta: novoStatus
            },
            detalhamento: {
              valor_principal: Math.abs(pendente),
              juros: 0,
              multa: 0,
              desconto: 0,
              total: Math.abs(pendente)
            }
          }
        }
      })

      return Response.json(result.response)
    }

    const form = await req.formData()

    const descricao = String(form.get('descricao') || '').trim()
    const valorRaw = String(form.get('valor') || '').trim()
    const data_lancamento = String(form.get('data_lancamento') || '').trim()
    if (!descricao) return Response.json({ success: false, message: 'descricao é obrigatório' }, { status: 400 })
    if (!valorRaw) return Response.json({ success: false, message: 'valor é obrigatório' }, { status: 400 })
    if (!data_lancamento) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })

    const valor = Number(valorRaw)
    if (Number.isNaN(valor)) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

    const tenant_id_raw = String(form.get('tenant_id') || '').trim()
    const entidade_id_raw = String(form.get('entidade_id') || '').trim() // cliente (não usado no header)
    const categoria_id_raw = String(form.get('categoria_id') || '').trim() // não usado no header
    const conta_financeira_id_raw = String(form.get('conta_financeira_id') || '').trim()
    const status = String(form.get('status') || '').trim() || null

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    const entidade_id = entidade_id_raw ? Number(entidade_id_raw) : null
    const categoria_id = categoria_id_raw ? Number(categoria_id_raw) : null
    const conta_financeira_id = conta_financeira_id_raw ? Number(conta_financeira_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO financeiro.pagamentos_recebidos (
           tenant_id, status, data_recebimento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_recebido, observacao
         ) VALUES ($1, COALESCE($2,'recebido'), $3, $3, $4, NULL, $5, $6)
         RETURNING id`,
        [tenant_id, status, data_lancamento, conta_financeira_id, Math.abs(valor), descricao]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar pagamento recebido')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/pagamentos-recebidos POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
