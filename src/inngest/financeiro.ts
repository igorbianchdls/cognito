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
