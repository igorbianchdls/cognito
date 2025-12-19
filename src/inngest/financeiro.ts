import { inngest } from '@/lib/inngest'
import { withTransaction, runQuery } from '@/lib/postgres'

type ContaAPagarPayload = {
  conta_pagar_id: number
  tenant_id: number
  fornecedor_id: number | null
  categoria_despesa_id: number | null
  conta_financeira_id: number | null
  numero_documento: string | null
  data_lancamento: string
  valor_liquido: number
  descricao: string
  subtipo?: string | null
  plano_conta_id?: number | null
}

export const contaAPagarCriadaFn = inngest.createFunction(
  { id: 'financeiro.contas-a-pagar.criada->contabil' },
  { event: 'financeiro/contas_a_pagar/criada' },
  async ({ event, step }) => {
    const data = (event.data || {}) as Partial<ContaAPagarPayload>
    const id = Number(data.conta_pagar_id)
    if (!Number.isFinite(id)) {
      await step.run('validate-payload', async () => { throw new Error('conta_pagar_id inválido') })
    }

    // Sempre recarrega a conta do banco para consistência
    const conta = await step.run('fetch-conta', async () => {
      const rows = await runQuery<Record<string, unknown>>(
        `SELECT id, tenant_id, fornecedor_id, categoria_despesa_id, conta_financeira_id,
                numero_documento, data_lancamento, valor_liquido, observacao
           FROM financeiro.contas_pagar
          WHERE id = $1
          LIMIT 1`,
        [id]
      )
      return rows[0]
    })

    if (!conta) return { skipped: true, reason: 'conta_pagar not found' }

    const tenant_id = Number(conta['tenant_id'] ?? data.tenant_id ?? 1)
    const fornecedor_id = conta['fornecedor_id'] !== null && conta['fornecedor_id'] !== undefined ? Number(conta['fornecedor_id']) : null
    const categoria_id = conta['categoria_despesa_id'] !== null && conta['categoria_despesa_id'] !== undefined ? Number(conta['categoria_despesa_id']) : null
    const conta_financeira_id = conta['conta_financeira_id'] !== null && conta['conta_financeira_id'] !== undefined ? Number(conta['conta_financeira_id']) : null
    const numero_documento = String(conta['numero_documento'] || data.numero_documento || '') || null
    const data_lancamento = String(conta['data_lancamento'] || data.data_lancamento || new Date().toISOString().slice(0,10))
    const valor_liquido = Math.abs(Number(conta['valor_liquido'] ?? data.valor_liquido ?? 0))
    const historico = String(conta['observacao'] ?? data.descricao ?? 'Conta a pagar')

    // Idempotência: verifica se já existe lançamento para a mesma origem
    const existing = await step.run('check-existing', async () => {
      const rows = await runQuery<{ id: number }>(
        `SELECT id
           FROM contabilidade.lancamentos_contabeis
          WHERE origem_tabela = 'financeiro.contas_pagar' AND origem_id = $1
          LIMIT 1`,
        [id]
      )
      return rows[0]?.id || null
    })
    if (existing) return { alreadyExists: true, lcId: existing }

    // Categoria -> plano (débito)
    const planoContaId = await step.run('fetch-categoria-e-plano', async () => {
      if (!Number.isFinite(categoria_id)) return null
      const rows = await runQuery<{ plano_conta_id: number | null }>(
        `SELECT plano_conta_id FROM financeiro.categorias_despesa WHERE id = $1 LIMIT 1`,
        [categoria_id]
      )
      const v = rows[0]?.plano_conta_id
      return v !== null && v !== undefined ? Number(v) : null
    })
    if (!Number.isFinite(planoContaId || NaN)) {
      await step.run('no-plano', async () => { console.warn('Categoria sem plano_conta_id', { conta_pagar_id: id, categoria_id }) })
      return { success: false, reason: 'categoria_sem_plano' }
    }

    // Seleção de regra contábil (por origem + plano), com fallback por subtipo
    const subtipo = (data.subtipo || 'principal').toString()
    const regra = await step.run('select-regra', async () => {
      const rows = await runQuery<Record<string, unknown>>(
        `SELECT r.id, r.conta_credito_id, r.descricao
           FROM contabilidade.regras_contabeis r
          WHERE r.tenant_id = $1
            AND r.origem = 'contas_a_pagar'
            AND r.plano_conta_id = $2
            AND (r.subtipo = $3 OR r.subtipo IS NULL)
          ORDER BY CASE WHEN r.subtipo = $3 THEN 0 ELSE 1 END, r.id ASC
          LIMIT 1`,
        [tenant_id, planoContaId!, subtipo]
      )
      return rows[0]
    })

    if (!regra) {
      await step.run('no-rule-log', async () => { console.warn('Sem regra contábil para plano', { tenant_id, id, plano_conta_id: planoContaId, subtipo }) })
      return { success: false, reason: 'no_rule' }
    }

    const contaDebitoId = Number(planoContaId)
    const contaCreditoId = Number(regra['conta_credito_id'])
    if (!Number.isFinite(contaCreditoId)) throw new Error('Regra contábil inválida: conta de crédito não definida')

    // Transação: cria cabeçalho e duas linhas
    const out = await step.run('create-lancamento', async () => withTransaction(async (client) => {
      const insertLcSql = `
        INSERT INTO contabilidade.lancamentos_contabeis
          (tenant_id, data_lancamento, historico, fornecedor_id, conta_financeira_id,
           total_debitos, total_creditos, origem_tabela, origem_id, origem_numero)
        VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9)
        RETURNING id`
      const lcVals = [
        tenant_id,
        data_lancamento,
        historico,
        fornecedor_id,
        conta_financeira_id,
        valor_liquido,
        'financeiro.contas_pagar',
        id,
        numero_documento,
      ]
      const lcRes = await client.query(insertLcSql, lcVals)
      const lcId = Number(lcRes.rows[0]?.id)

      const insertLinhaSql = `
        INSERT INTO contabilidade.lancamentos_contabeis_linhas
          (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico)
        VALUES ($1,$2,$3,$4,$5,$6)`
      await client.query(insertLinhaSql, [lcId, lcId, contaDebitoId, valor_liquido, 0, historico])
      await client.query(insertLinhaSql, [lcId, lcId, contaCreditoId, 0, valor_liquido, historico])

      return { lcId }
    }))

    return { success: true, lcId: out.lcId, regra_id: Number(regra['id'] || 0) }
  }
)

// Pagamento Efetuado -> Lançamento Contábil (liquidação de Fornecedores contra Banco)
type PagamentoEfetuadoPayload = { pagamento_id: number }

export const pagamentoEfetuadoCriadoFn = inngest.createFunction(
  { id: 'financeiro.pagamentos-efetuados.criado->contabil' },
  { event: 'financeiro/pagamentos_efetuados/criado' },
  async ({ event, step }) => {
    const data = (event.data || {}) as Partial<PagamentoEfetuadoPayload>
    const pagamentoId = Number(data.pagamento_id)
    if (!Number.isFinite(pagamentoId)) {
      await step.run('validate-payload', async () => { throw new Error('pagamento_id inválido') })
    }

    // Header do pagamento
    const pagamento = await step.run('fetch-pagamento', async () => {
      const rows = await runQuery<Record<string, unknown>>(
        `SELECT id, tenant_id, data_pagamento, data_lancamento, conta_financeira_id, valor_total_pagamento, observacao
           FROM financeiro.pagamentos_efetuados
          WHERE id = $1
          LIMIT 1`,
        [pagamentoId]
      )
      return rows[0]
    })
    if (!pagamento) return { skipped: true, reason: 'pagamento not found' }

    const tenant_id = Number(pagamento['tenant_id'] ?? 1)
    const data_pag = String(pagamento['data_pagamento'] || pagamento['data_lancamento'] || new Date().toISOString().slice(0,10))
    const conta_financeira_id = pagamento['conta_financeira_id'] !== null && pagamento['conta_financeira_id'] !== undefined ? Number(pagamento['conta_financeira_id']) : null
    const historico = String(pagamento['observacao'] ?? 'Pagamento efetuado')

    // Linhas do pagamento (sumários)
    const { totals, anyApId } = await step.run('fetch-linhas', async () => {
      const rows = await runQuery<{ valor_pago: number | null; desconto_financeiro: number | null; juros: number | null; multa: number | null; conta_pagar_id: number | null }>(
        `SELECT valor_pago, desconto_financeiro, juros, multa, conta_pagar_id
           FROM financeiro.pagamentos_efetuados_linhas
          WHERE pagamento_id = $1`,
        [pagamentoId]
      )
      let tp = 0, td = 0, tj = 0, tm = 0, apId: number | null = null
      for (const r of rows) {
        tp += Math.abs(Number(r.valor_pago || 0))
        td += Math.abs(Number(r.desconto_financeiro || 0))
        tj += Math.abs(Number(r.juros || 0))
        tm += Math.abs(Number(r.multa || 0))
        if (apId === null && r.conta_pagar_id !== null && r.conta_pagar_id !== undefined) apId = Number(r.conta_pagar_id)
      }
      return { totals: { total_pago: tp, total_desc: td, total_juros: tj, total_multa: tm }, anyApId: apId }
    })

    const total_pago = totals.total_pago
    const total_desc = totals.total_desc
    const total_encargos = totals.total_juros + totals.total_multa
    const liquida_fornec = total_pago - total_encargos + total_desc

    // Conta do banco (crédito)
    const contaBancoId = await step.run('resolve-banco', async () => {
      if (!Number.isFinite(conta_financeira_id || NaN)) return null
      const rows = await runQuery<{ conta_contabil_id: number | null }>(
        `SELECT conta_contabil_id FROM financeiro.contas_financeiras WHERE id = $1 LIMIT 1`,
        [conta_financeira_id!]
      )
      const v = rows[0]?.conta_contabil_id
      return v !== null && v !== undefined ? Number(v) : null
    })
    if (!Number.isFinite(contaBancoId || NaN)) return { success: false, reason: 'conta_financeira_sem_conta_contabil' }

    // Conta Fornecedores (débito): preferir LC da AP; senão regra AP por plano
    const contaFornecId = await step.run('resolve-fornecedores', async () => {
      if (Number.isFinite(anyApId || NaN)) {
        const viaLc = await runQuery<{ conta_id: number }>(
          `SELECT lcl.conta_id
             FROM contabilidade.lancamentos_contabeis lc
             JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
            WHERE lc.origem_tabela = 'financeiro.contas_pagar'
              AND lc.origem_id = $1
              AND lcl.credito > 0
            ORDER BY lcl.credito DESC, lcl.id ASC
            LIMIT 1`,
          [anyApId!]
        )
        if (viaLc.length) return Number(viaLc[0].conta_id)

        // fallback: regra AP por plano
        const planoRows = await runQuery<{ plano_conta_id: number | null }>(
          `SELECT cd.plano_conta_id
             FROM financeiro.contas_pagar cp
             LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
            WHERE cp.id = $1
            LIMIT 1`,
          [anyApId!]
        )
        const planoId = planoRows[0]?.plano_conta_id
        if (planoId !== null && planoId !== undefined) {
          const regra = await runQuery<{ conta_credito_id: number | null }>(
            `SELECT conta_credito_id
               FROM contabilidade.regras_contabeis
              WHERE tenant_id = $1
                AND origem = 'contas_a_pagar'
                AND plano_conta_id = $2
              ORDER BY id ASC
              LIMIT 1`,
            [tenant_id, Number(planoId)]
          )
          const cred = regra[0]?.conta_credito_id
          if (cred !== null && cred !== undefined) return Number(cred)
        }
      }
      return null
    })
    if (!Number.isFinite(contaFornecId || NaN)) return { success: false, reason: 'conta_fornecedores_indefinida' }

    // Regras opcionais para desconto/juros/multa
    const [contaDescontoId, contaJurosId, contaMultaId] = await step.run('resolve-regras-extras', async () => {
      const desc = await runQuery<{ conta_credito_id: number | null }>(
        `SELECT conta_credito_id FROM contabilidade.regras_contabeis
          WHERE tenant_id = $1 AND origem = 'pagamentos_efetuados' AND subtipo = 'desconto'
          ORDER BY id ASC LIMIT 1`, [tenant_id]
      )
      const juros = await runQuery<{ conta_debito_id: number | null }>(
        `SELECT conta_debito_id FROM contabilidade.regras_contabeis
          WHERE tenant_id = $1 AND origem = 'pagamentos_efetuados' AND subtipo = 'juros'
          ORDER BY id ASC LIMIT 1`, [tenant_id]
      )
      const multa = await runQuery<{ conta_debito_id: number | null }>(
        `SELECT conta_debito_id FROM contabilidade.regras_contabeis
          WHERE tenant_id = $1 AND origem = 'pagamentos_efetuados' AND subtipo = 'multa'
          ORDER BY id ASC LIMIT 1`, [tenant_id]
      )
      return [desc[0]?.conta_credito_id ?? null, juros[0]?.conta_debito_id ?? null, multa[0]?.conta_debito_id ?? null]
    })

    // Idempotência por origem
    const existing = await step.run('check-existing', async () => {
      const rows = await runQuery<{ id: number }>(
        `SELECT id FROM contabilidade.lancamentos_contabeis WHERE origem_tabela = 'financeiro.pagamentos_efetuados' AND origem_id = $1 LIMIT 1`,
        [pagamentoId]
      )
      return rows[0]?.id || null
    })
    if (existing) return { alreadyExists: true, lcId: existing }

    // Inserção transacional (cabeçalho + linhas)
    const out = await step.run('create-lancamento', async () => withTransaction(async (client) => {
      const totalDeb = liquida_fornec + total_encargos
      const totalCred = total_pago + total_desc
      if (Math.abs(totalDeb - totalCred) > 0.001) throw new Error('Lançamento não balanceado')

      const insertLcSql = `
        INSERT INTO contabilidade.lancamentos_contabeis
          (tenant_id, data_lancamento, historico, conta_financeira_id,
           total_debitos, total_creditos, origem_tabela, origem_id, origem_numero)
        VALUES ($1,$2,$3,$4,$5,$6,'financeiro.pagamentos_efetuados',$7,NULL)
        RETURNING id`
      const lcVals = [tenant_id, data_pag, historico, conta_financeira_id, totalDeb, totalCred, pagamentoId]
      const lcRes = await client.query(insertLcSql, lcVals)
      const lcId = Number(lcRes.rows[0]?.id)

      const insertLinhaSql = `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico) VALUES ($1,$2,$3,$4,$5,$6)`
      // Dr Fornecedores (liquidação)
      await client.query(insertLinhaSql, [lcId, lcId, contaFornecId, liquida_fornec, 0, historico])
      // Dr Despesas (juros+multa), se houver e houver conta
      if (total_encargos > 0) {
        const contaEncargos = (contaJurosId || contaMultaId) ?? null
        await client.query(insertLinhaSql, [lcId, lcId, contaEncargos ?? contaFornecId, total_encargos, 0, historico])
      }
      // Cr Banco (valor pago)
      await client.query(insertLinhaSql, [lcId, lcId, contaBancoId, 0, total_pago, historico])
      // Cr Descontos Obtidos, se houver e houver conta
      if (total_desc > 0 && contaDescontoId) {
        await client.query(insertLinhaSql, [lcId, lcId, contaDescontoId, 0, total_desc, historico])
      } else if (total_desc > 0) {
        // Sem conta específica de desconto: registra como redução do banco (ainda balanceia pelos totais)
        await client.query(insertLinhaSql, [lcId, lcId, contaBancoId, 0, total_desc, historico])
      }

      return { lcId }
    }))

    return { success: true, lcId: out.lcId }
  }
)

// Conta a Receber -> Lançamento Contábil (reconhecimento de Receita)
type ContaAReceberPayload = { conta_receber_id: number }

export const contaAReceberCriadaFn = inngest.createFunction(
  { id: 'financeiro.contas-a-receber.criada->contabil' },
  { event: 'financeiro/contas_a_receber/criada' },
  async ({ event, step }) => {
    const data = (event.data || {}) as Partial<ContaAReceberPayload>
    const id = Number(data.conta_receber_id)
    if (!Number.isFinite(id)) await step.run('validate', async () => { throw new Error('conta_receber_id inválido') })

    // Carrega a CR
    const cr = await step.run('fetch-cr', async () => {
      const rows = await runQuery<Record<string, unknown>>(
        `SELECT id, tenant_id, cliente_id, categoria_receita_id, categoria_financeira_id,
                numero_documento, data_lancamento, valor_liquido, observacao
           FROM financeiro.contas_receber
          WHERE id = $1
          LIMIT 1`,
        [id]
      )
      return rows[0]
    })
    if (!cr) return { skipped: true, reason: 'conta_receber_not_found' }

    const tenant_id = Number(cr['tenant_id'] ?? 1)
    const cliente_id = cr['cliente_id'] !== null && cr['cliente_id'] !== undefined ? Number(cr['cliente_id']) : null
    const categoria_receita_id = cr['categoria_receita_id'] !== null && cr['categoria_receita_id'] !== undefined ? Number(cr['categoria_receita_id']) : null
    const numero_documento = String(cr['numero_documento'] || '') || null
    const data_lancamento = String(cr['data_lancamento'] || new Date().toISOString().slice(0,10))
    const valor_liquido = Math.abs(Number(cr['valor_liquido'] ?? 0))
    const historico = String(cr['observacao'] ?? 'Conta a receber')

    // Idempotência
    const existing = await step.run('check-existing', async () => {
      const rows = await runQuery<{ id: number }>(
        `SELECT id FROM contabilidade.lancamentos_contabeis WHERE origem_tabela = 'financeiro.contas_receber' AND origem_id = $1 LIMIT 1`,
        [id]
      )
      return rows[0]?.id || null
    })
    if (existing) return { alreadyExists: true, lcId: existing }

    // Categoria Receita -> plano (Cr Receita)
    const planoReceitaId = await step.run('fetch-plano-receita', async () => {
      if (!Number.isFinite(categoria_receita_id || NaN)) return null
      const rows = await runQuery<{ plano_conta_id: number | null }>(
        `SELECT plano_conta_id FROM financeiro.categorias_receita WHERE id = $1 LIMIT 1`,
        [categoria_receita_id!]
      )
      const v = rows[0]?.plano_conta_id
      return v !== null && v !== undefined ? Number(v) : null
    })
    if (!Number.isFinite(planoReceitaId || NaN)) return { success: false, reason: 'categoria_sem_plano' }

    // Regra: origem='contas_a_receber' + plano -> conta de Clientes (Dr)
    const regra = await step.run('select-regra', async () => {
      const rows = await runQuery<{ conta_debito_id: number | null; id: number | null; descricao: string | null }>(
        `SELECT id, conta_debito_id, descricao
           FROM contabilidade.regras_contabeis
          WHERE tenant_id = $1 AND origem = 'contas_a_receber' AND plano_conta_id = $2
          ORDER BY id ASC
          LIMIT 1`,
        [tenant_id, Number(planoReceitaId)]
      )
      return rows[0] || null
    })
    const contaClientesId = regra?.conta_debito_id !== null && regra?.conta_debito_id !== undefined ? Number(regra?.conta_debito_id) : null
    if (!Number.isFinite(contaClientesId || NaN)) return { success: false, reason: 'regra_sem_conta_clientes' }

    // Inserção transacional
    const out = await step.run('create-lancamento', async () => withTransaction(async (client) => {
      const insertLcSql = `
        INSERT INTO contabilidade.lancamentos_contabeis
          (tenant_id, data_lancamento, historico, cliente_id,
           total_debitos, total_creditos, origem_tabela, origem_id, origem_numero)
        VALUES ($1,$2,$3,$4,$5,$5,'financeiro.contas_receber',$6,$7)
        RETURNING id`
      const lcVals = [tenant_id, data_lancamento, (regra?.descricao ?? historico), cliente_id, valor_liquido, id, numero_documento]
      const lcRes = await client.query(insertLcSql, lcVals)
      const lcId = Number(lcRes.rows[0]?.id)

      const insertLinhaSql = `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico) VALUES ($1,$2,$3,$4,$5,$6)`
      // Dr Clientes
      await client.query(insertLinhaSql, [lcId, lcId, contaClientesId, valor_liquido, 0, historico])
      // Cr Receita (plano da categoria)
      await client.query(insertLinhaSql, [lcId, lcId, Number(planoReceitaId), 0, valor_liquido, historico])

      return { lcId }
    }))

    return { success: true, lcId: out.lcId, regra_id: regra?.id ?? null }
  }
)

// Pagamento Recebido -> Lançamento Contábil (liquidação de Clientes contra Banco)
type PagamentoRecebidoPayload = { pagamento_id: number }

export const pagamentoRecebidoCriadoFn = inngest.createFunction(
  { id: 'financeiro.pagamentos-recebidos.criado->contabil' },
  { event: 'financeiro/pagamentos_recebidos/criado' },
  async ({ event, step }) => {
    const data = (event.data || {}) as Partial<PagamentoRecebidoPayload>
    const pagamentoId = Number(data.pagamento_id)
    if (!Number.isFinite(pagamentoId)) await step.run('validate', async () => { throw new Error('pagamento_id inválido') })

    const pr = await step.run('fetch-header', async () => {
      const rows = await runQuery<Record<string, unknown>>(
        `SELECT id, tenant_id, data_recebimento, data_lancamento, conta_financeira_id, valor_total_recebido, observacao
           FROM financeiro.pagamentos_recebidos
          WHERE id = $1
          LIMIT 1`,
        [pagamentoId]
      )
      return rows[0]
    })
    if (!pr) return { skipped: true, reason: 'pagamento_not_found' }

    const tenant_id = Number(pr['tenant_id'] ?? 1)
    const data_rec = String(pr['data_recebimento'] || pr['data_lancamento'] || new Date().toISOString().slice(0,10))
    const conta_financeira_id = pr['conta_financeira_id'] !== null && pr['conta_financeira_id'] !== undefined ? Number(pr['conta_financeira_id']) : null
    const historico = String(pr['observacao'] ?? 'Pagamento recebido')

    const { totals, anyCrId } = await step.run('fetch-lines', async () => {
      const rows = await runQuery<{ valor_recebido: number | null; desconto_financeiro: number | null; juros: number | null; multa: number | null; conta_receber_id: number | null }>(
        `SELECT valor_recebido, desconto_financeiro, juros, multa, conta_receber_id
           FROM financeiro.pagamentos_recebidos_linhas
          WHERE pagamento_id = $1`,
        [pagamentoId]
      )
      let tr = 0, td = 0, tj = 0, tm = 0, crId: number | null = null
      for (const r of rows) {
        tr += Math.abs(Number(r.valor_recebido || 0))
        td += Math.abs(Number(r.desconto_financeiro || 0))
        tj += Math.abs(Number(r.juros || 0))
        tm += Math.abs(Number(r.multa || 0))
        if (crId === null && r.conta_receber_id !== null && r.conta_receber_id !== undefined) crId = Number(r.conta_receber_id)
      }
      return { totals: { total_recebido: tr, total_desc: td, total_juros: tj, total_multa: tm }, anyCrId: crId }
    })

    const total_recebido = totals.total_recebido
    const total_desc = totals.total_desc
    const total_acresc = totals.total_juros + totals.total_multa
    const liquida_clientes = total_recebido + total_desc - total_acresc

    // Conta Banco (Dr)
    const contaBancoId = await step.run('resolve-banco', async () => {
      if (!Number.isFinite(conta_financeira_id || NaN)) return null
      const rows = await runQuery<{ conta_contabil_id: number | null }>(
        `SELECT conta_contabil_id FROM financeiro.contas_financeiras WHERE id = $1 LIMIT 1`,
        [conta_financeira_id!]
      )
      const v = rows[0]?.conta_contabil_id
      return v !== null && v !== undefined ? Number(v) : null
    })
    if (!Number.isFinite(contaBancoId || NaN)) return { success: false, reason: 'conta_financeira_sem_conta_contabil' }

    // Conta Clientes (Cr): via LC da AR ou regra AR por plano
    const contaClientesId = await step.run('resolve-clientes', async () => {
      if (Number.isFinite(anyCrId || NaN)) {
        const viaLc = await runQuery<{ conta_id: number }>(
          `SELECT lcl.conta_id
             FROM contabilidade.lancamentos_contabeis lc
             JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
            WHERE lc.origem_tabela = 'financeiro.contas_receber'
              AND lc.origem_id = $1
              AND lcl.debito > 0
            ORDER BY lcl.debito DESC, lcl.id ASC
            LIMIT 1`,
          [anyCrId!]
        )
        if (viaLc.length) return Number(viaLc[0].conta_id)
        const planoRows = await runQuery<{ plano_conta_id: number | null }>(
          `SELECT cr.plano_conta_id
             FROM financeiro.contas_receber ar
             LEFT JOIN financeiro.categorias_receita cr ON cr.id = ar.categoria_receita_id
            WHERE ar.id = $1
            LIMIT 1`,
          [anyCrId!]
        )
        const planoId = planoRows[0]?.plano_conta_id
        if (planoId !== null && planoId !== undefined) {
          const regra = await runQuery<{ conta_debito_id: number | null }>(
            `SELECT conta_debito_id
               FROM contabilidade.regras_contabeis
              WHERE tenant_id = $1 AND origem = 'contas_a_receber' AND plano_conta_id = $2
              ORDER BY id ASC LIMIT 1`,
            [tenant_id, Number(planoId)]
          )
          const deb = regra[0]?.conta_debito_id
          if (deb !== null && deb !== undefined) return Number(deb)
        }
      }
      return null
    })
    if (!Number.isFinite(contaClientesId || NaN)) return { success: false, reason: 'conta_clientes_indefinida' }

    // Regras extras para descontos/juros/multa
    const [contaDescId, contaJurosId, contaMultaId] = await step.run('resolve-extra-accounts', async () => {
      const desc = await runQuery<{ conta_debito_id: number | null }>(
        `SELECT conta_debito_id FROM contabilidade.regras_contabeis
          WHERE tenant_id = $1 AND origem = 'pagamentos_recebidos' AND subtipo = 'desconto'
          ORDER BY id ASC LIMIT 1`, [tenant_id]
      )
      const juros = await runQuery<{ conta_credito_id: number | null }>(
        `SELECT conta_credito_id FROM contabilidade.regras_contabeis
          WHERE tenant_id = $1 AND origem = 'pagamentos_recebidos' AND subtipo = 'juros'
          ORDER BY id ASC LIMIT 1`, [tenant_id]
      )
      const multa = await runQuery<{ conta_credito_id: number | null }>(
        `SELECT conta_credito_id FROM contabilidade.regras_contabeis
          WHERE tenant_id = $1 AND origem = 'pagamentos_recebidos' AND subtipo = 'multa'
          ORDER BY id ASC LIMIT 1`, [tenant_id]
      )
      return [desc[0]?.conta_debito_id ?? null, juros[0]?.conta_credito_id ?? null, multa[0]?.conta_credito_id ?? null]
    })

    // Idempotência
    const existing = await step.run('check-existing', async () => {
      const rows = await runQuery<{ id: number }>(
        `SELECT id FROM contabilidade.lancamentos_contabeis WHERE origem_tabela = 'financeiro.pagamentos_recebidos' AND origem_id = $1 LIMIT 1`,
        [pagamentoId]
      )
      return rows[0]?.id || null
    })
    if (existing) return { alreadyExists: true, lcId: existing }

    // Inserção
    const out = await step.run('create-lancamento', async () => withTransaction(async (client) => {
      const totalDeb = total_recebido + total_desc
      const totalCred = liquida_clientes + total_acresc
      if (Math.abs(totalDeb - totalCred) > 0.001) throw new Error('Lançamento não balanceado')

      const insertLcSql = `INSERT INTO contabilidade.lancamentos_contabeis (tenant_id, data_lancamento, historico, conta_financeira_id, total_debitos, total_creditos, origem_tabela, origem_id, origem_numero) VALUES ($1,$2,$3,$4,$5,$6,'financeiro.pagamentos_recebidos',$7,NULL) RETURNING id`
      const lcVals = [tenant_id, data_rec, historico, conta_financeira_id, totalDeb, totalCred, pagamentoId]
      const lcRes = await client.query(insertLcSql, lcVals)
      const lcId = Number(lcRes.rows[0]?.id)

      const insertLinhaSql = `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico) VALUES ($1,$2,$3,$4,$5,$6)`
      // Dr Banco
      await client.query(insertLinhaSql, [lcId, lcId, contaBancoId, total_recebido, 0, historico])
      // Dr Descontos Concedidos (se houver conta)
      if (total_desc > 0 && contaDescId) {
        await client.query(insertLinhaSql, [lcId, lcId, contaDescId, total_desc, 0, historico])
      } else if (total_desc > 0) {
        await client.query(insertLinhaSql, [lcId, lcId, contaBancoId, total_desc, 0, historico])
      }
      // Cr Clientes
      await client.query(insertLinhaSql, [lcId, lcId, contaClientesId, 0, liquida_clientes, historico])
      // Cr Juros/Multa (se houver contas)
      if (totals.total_juros > 0 && contaJurosId) {
        await client.query(insertLinhaSql, [lcId, lcId, contaJurosId, 0, totals.total_juros, historico])
      } else if (totals.total_juros > 0) {
        await client.query(insertLinhaSql, [lcId, lcId, contaClientesId, 0, totals.total_juros, historico])
      }
      if (totals.total_multa > 0 && contaMultaId) {
        await client.query(insertLinhaSql, [lcId, lcId, contaMultaId, 0, totals.total_multa, historico])
      } else if (totals.total_multa > 0) {
        await client.query(insertLinhaSql, [lcId, lcId, contaClientesId, 0, totals.total_multa, historico])
      }

      return { lcId }
    }))

    return { success: true, lcId: out.lcId }
  }
)
