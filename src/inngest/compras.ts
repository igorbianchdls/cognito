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

function toISODate(value: unknown, fallback?: Date): string {
  if (typeof value === 'string') {
    // Accept 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ssZ'
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    const m = value.match(/^(\d{4}-\d{2}-\d{2})/)
    if (m) return m[1]
    const d = new Date(value)
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  } else if (value instanceof Date) {
    if (!isNaN(value.getTime())) return value.toISOString().slice(0, 10)
  }
  const d = fallback ?? new Date()
  return d.toISOString().slice(0, 10)
}

export async function createApFromCompra(compraId: number): Promise<{ apId: number }> {
  // Carrega a compra
  const compraRows = await runQuery<CompraHeader>(
    `SELECT c.id, c.tenant_id, c.fornecedor_id, c.filial_id, c.centro_custo_id, c.projeto_id, c.categoria_despesa_id,
            c.numero_oc, c.data_emissao, c.data_entrega_prevista, c.valor_total, c.observacoes
       FROM compras.compras c
      WHERE c.id = $1
      LIMIT 1`,
    [compraId]
  )
  const compra = compraRows[0]
  if (!compra) throw new Error('compra not found')

  const tenantId = Number(compra.tenant_id ?? 1)
  const fornecedorId = compra.fornecedor_id !== null && compra.fornecedor_id !== undefined ? Number(compra.fornecedor_id) : null
  const ccId = compra.centro_custo_id !== null && compra.centro_custo_id !== undefined ? Number(compra.centro_custo_id) : null
  const filialId = compra.filial_id !== null && compra.filial_id !== undefined ? Number(compra.filial_id) : null
  const categoriaId = compra.categoria_despesa_id !== null && compra.categoria_despesa_id !== undefined ? Number(compra.categoria_despesa_id) : null
  const numeroDoc = (compra.numero_oc && compra.numero_oc.trim()) ? compra.numero_oc.trim() : `OC-${compra.id}`
  const dataDoc = toISODate(compra.data_emissao)
  const dataLanc = dataDoc
  const dataVenc = toISODate(compra.data_entrega_prevista, new Date(dataDoc))
  const valorTotal = Math.abs(Number(compra.valor_total || 0))
  const observacao = (compra.observacoes && compra.observacoes.trim()) || `Compra ${numeroDoc} (ID ${compra.id})`

  // Idempotência: evita duplicar AP para a mesma OC
  const existingAp = await runQuery<{ id: number }>(
    `SELECT id FROM financeiro.contas_pagar WHERE tenant_id = $1 AND numero_documento = $2 LIMIT 1`,
    [tenantId, numeroDoc]
  )
  if (existingAp[0]?.id) return { apId: Number(existingAp[0].id) }

  // Linhas
  const linhas = await runQuery<{
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

  const result = await withTransaction(async (client) => {
    const insertAp = await client.query(
      `INSERT INTO financeiro.contas_pagar (
         tenant_id, fornecedor_id, categoria_despesa_id, centro_custo_id, departamento_id, filial_id, unidade_negocio_id,
         numero_documento, tipo_documento, status, data_documento, data_lancamento, data_vencimento,
         valor_bruto, valor_desconto, valor_impostos, valor_liquido, observacao
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

    const items = (linhas.length ? linhas : [{ id: 0, produto_id: null, produto: null, quantidade: 1, unidade_medida: null, preco_unitario: valorTotal, total: valorTotal, centro_custo_id: ccId }])

    const cols = ['conta_pagar_id','tipo_linha','descricao','quantidade','valor_unitario','valor_bruto','desconto','impostos','valor_liquido','categoria_despesa_id','departamento_id','centro_custo_id','unidade_negocio_id']
    const valuesSql: string[] = []
    const params: unknown[] = []
    let i = 1
    for (const it of items) {
      const q = Math.max(1, Number(it.quantidade || 1))
      const vu = Math.abs(Number(it.preco_unitario || 0))
      const bruto = (q * vu) || Math.abs(Number(it.total || 0))
      const liquido = Math.abs(Number(it.total || bruto))
      const descr = it.produto ? String(it.produto) : `Item de compra ${it.id || ''}`.trim()
      const linhaCcId = it.centro_custo_id !== null && it.centro_custo_id !== undefined ? Number(it.centro_custo_id) : ccId
      valuesSql.push(`($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`)
      params.push(apId,'item',descr,q,vu,bruto,0,0,liquido,categoriaId || null,null,linhaCcId || null,null)
    }
    if (valuesSql.length) {
      await client.query(
        `INSERT INTO financeiro.contas_pagar_linhas (${cols.join(',')}) VALUES ${valuesSql.join(',')}`,
        params
      )
    }

    return { apId }
  })

  return result
}

export const compraCriadaFn = inngest.createFunction(
  { id: 'compras.compra.criada->ap' },
  { event: 'compras/compra/criada' },
  async ({ event, step }) => {
    const compraId = Number((event.data as any)?.compra_id)
    if (!Number.isFinite(compraId)) {
      await step.run('validate', async () => { throw new Error('compra_id inválido') })
    }
    const result = await step.run('create-ap-inline', async () => createApFromCompra(compraId))

    // Dispara evento para contabilidade
    try {
      await inngest.send({
        name: 'financeiro/contas_a_pagar/criada',
        data: {
          conta_pagar_id: result.apId,
          tenant_id: null,
          fornecedor_id: null,
          categoria_despesa_id: null,
          conta_financeira_id: null,
          numero_documento: null,
          data_lancamento: new Date().toISOString().slice(0,10),
          valor_liquido: 0,
          descricao: 'Compra -> AP',
          subtipo: 'principal',
        },
      })
    } catch (e) {
      console.warn('Falha ao enviar evento Inngest contas_a_pagar.criada (via compras)', e)
    }

    return { success: true, apId: result.apId }
  }
)
