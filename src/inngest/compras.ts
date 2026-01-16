import { inngest } from '@/lib/inngest'
import { withTransaction, runQuery } from '@/lib/postgres'

type CompraHeader = {
  id: number
  tenant_id: number | null
  fornecedor_id: number | null
  filial_id: number | null
  centro_custo_id: number | null
  projeto_id: number | null
  categoria_despesa_id: number | null
  numero_oc: string | null
  data_emissao: string | null
  data_entrega_prevista: string | null
  valor_total: number | null
  observacoes: string | null
}

export const compraCriadaFn = inngest.createFunction(
  { id: 'compras.compra.criada->ap' },
  { event: 'compras/compra/criada' },
  async ({ event, step }) => {
    const compraId = Number((event.data as any)?.compra_id)
    if (!Number.isFinite(compraId)) {
      await step.run('validate', async () => { throw new Error('compra_id inválido') })
    }

    // Carrega a compra
    const compra = await step.run('fetch-compra', async () => {
      const rows = await runQuery<CompraHeader>(
        `SELECT c.id, c.tenant_id, c.fornecedor_id, c.filial_id, c.centro_custo_id, c.projeto_id, c.categoria_despesa_id,
                c.numero_oc, c.data_emissao, c.data_entrega_prevista, c.valor_total, c.observacoes
           FROM compras.compras c
          WHERE c.id = $1
          LIMIT 1`,
        [compraId]
      )
      return rows[0]
    })

    if (!compra) return { skipped: true, reason: 'compra not found' }

    const tenantId = Number(compra.tenant_id ?? 1)
    const fornecedorId = compra.fornecedor_id !== null && compra.fornecedor_id !== undefined ? Number(compra.fornecedor_id) : null
    const ccId = compra.centro_custo_id !== null && compra.centro_custo_id !== undefined ? Number(compra.centro_custo_id) : null
    const filialId = compra.filial_id !== null && compra.filial_id !== undefined ? Number(compra.filial_id) : null
    const categoriaId = compra.categoria_despesa_id !== null && compra.categoria_despesa_id !== undefined ? Number(compra.categoria_despesa_id) : null
    const numeroDoc = (compra.numero_oc && compra.numero_oc.trim()) ? compra.numero_oc.trim() : `OC-${compra.id}`
    const dataDoc = (compra.data_emissao && String(compra.data_emissao)) || new Date().toISOString().slice(0,10)
    const dataLanc = dataDoc
    const dataVenc = (compra.data_entrega_prevista && String(compra.data_entrega_prevista)) || dataDoc
    const valorTotal = Math.abs(Number(compra.valor_total || 0))
    const observacao = (compra.observacoes && compra.observacoes.trim()) || `Compra ${numeroDoc} (ID ${compra.id})`

    // Idempotência: evita duplicar AP para a mesma OC
    const existingApId = await step.run('check-existing-ap', async () => {
      const rows = await runQuery<{ id: number }>(
        `SELECT id FROM financeiro.contas_pagar WHERE tenant_id = $1 AND numero_documento = $2 LIMIT 1`,
        [tenantId, numeroDoc]
      )
      return rows[0]?.id || null
    })
    if (existingApId) return { alreadyExists: true, conta_pagar_id: existingApId }

    // Linhas da compra (para compor itens da AP)
    const linhas = await step.run('fetch-linhas-compra', async () => {
      const rows = await runQuery<{
        id: number
        produto_id: number | null
        produto: string | null
        quantidade: number | null
        unidade_medida: string | null
        preco_unitario: number | null
        total: number | null
        centro_custo_id: number | null
      }>(
        `SELECT cl.id, cl.produto_id, p.nome AS produto, cl.quantidade, cl.unidade_medida, cl.preco_unitario, cl.total, cl.centro_custo_id
           FROM compras.compras_linhas cl
           LEFT JOIN produtos.produto p ON p.id = cl.produto_id
          WHERE cl.compra_id = $1
          ORDER BY cl.id ASC`,
        [compraId]
      )
      return rows
    })

    // Insere AP + itens
    const result = await step.run('create-ap', async () => withTransaction(async (client) => {
      const insertAp = await client.query(
        `INSERT INTO financeiro.contas_pagar (
           tenant_id,
           fornecedor_id,
           categoria_despesa_id,
           centro_custo_id,
           departamento_id,
           filial_id,
           unidade_negocio_id,
           numero_documento,
           tipo_documento,
           status,
           data_documento,
           data_lancamento,
           data_vencimento,
           valor_bruto,
           valor_desconto,
           valor_impostos,
           valor_liquido,
           observacao
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
         ) RETURNING id`,
        [
          tenantId,
          fornecedorId,
          categoriaId,
          ccId,
          null,
          filialId,
          null,
          numeroDoc,
          'oc',
          'pendente',
          dataDoc,
          dataLanc,
          dataVenc,
          valorTotal,
          0,
          0,
          valorTotal,
          observacao,
        ]
      )
      const apId = Number(insertAp.rows[0]?.id)
      if (!apId) throw new Error('Falha ao criar conta a pagar')

      // Itens (uma linha por item da compra). Se não houver itens, cria 1 linha com valor total
      const items = (linhas.length ? linhas : [{
        id: 0, produto_id: null, produto: null, quantidade: 1, unidade_medida: null, preco_unitario: valorTotal, total: valorTotal, centro_custo_id: ccId,
      }])

      const cols = [
        'conta_pagar_id',
        'tipo_linha',
        'descricao',
        'quantidade',
        'valor_unitario',
        'valor_bruto',
        'desconto',
        'impostos',
        'valor_liquido',
        'categoria_despesa_id',
        'departamento_id',
        'centro_custo_id',
        'unidade_negocio_id'
      ]

      const valuesSql: string[] = []
      const params: unknown[] = []
      let i = 1
      for (const it of items) {
        const q = Math.max(1, Number(it.quantidade || 1))
        const vu = Math.abs(Number(it.preco_unitario || 0))
        const bruto = (q * vu) || Math.abs(Number(it.total || 0))
        const liquido = Math.abs(Number(it.total || bruto))
        const desc = 0
        const impostos = 0
        const descr = it.produto ? String(it.produto) : `Item de compra ${it.id || ''}`.trim()
        const linhaCcId = it.centro_custo_id !== null && it.centro_custo_id !== undefined ? Number(it.centro_custo_id) : ccId

        valuesSql.push(`($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`)
        params.push(
          apId,
          'item',
          descr,
          q,
          vu,
          bruto,
          desc,
          impostos,
          liquido,
          categoriaId || null,
          null,
          linhaCcId || null,
          null,
        )
      }

      if (valuesSql.length) {
        await client.query(
          `INSERT INTO financeiro.contas_pagar_linhas (${cols.join(',')})
           VALUES ${valuesSql.join(',')}`,
          params
        )
      }

      return { apId }
    }))

    // Dispara evento para contabilidade
    try {
      await inngest.send({
        name: 'financeiro/contas_a_pagar/criada',
        data: {
          conta_pagar_id: result.apId,
          tenant_id: tenantId,
          fornecedor_id: fornecedorId,
          categoria_despesa_id: categoriaId,
          conta_financeira_id: null,
          numero_documento: numeroDoc,
          data_lancamento: dataLanc,
          valor_liquido: valorTotal,
          descricao: observacao,
          subtipo: 'principal',
        },
      })
    } catch (e) {
      console.warn('Falha ao enviar evento Inngest contas_a_pagar.criada (via compras)', e)
    }

    return { success: true, apId: result.apId }
  }
)

