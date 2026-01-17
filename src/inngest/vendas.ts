import { inngest } from '@/lib/inngest'
import { withTransaction, runQuery } from '@/lib/postgres'

function toISODate(value: unknown, fallback?: Date): string {
  if (typeof value === 'string') {
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

export async function createCrFromPedido(pedidoId: number): Promise<{ crId: number }> {
  // Descobrir colunas existentes para montar SELECT compatível
  const colsInfo = await runQuery<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='vendas' AND table_name='pedidos'`
  )
  const has = (c: string) => colsInfo.some(r => r.column_name === c)
  const selectParts = [
    'p.id',
    'p.tenant_id',
    'p.cliente_id',
    has('numero_pedido') ? 'p.numero_pedido' : "NULL AS numero_pedido",
    'p.data_pedido',
    'p.valor_total',
    has('descricao') ? 'p.descricao' : 'NULL AS descricao',
    has('categoria_receita_id') ? 'p.categoria_receita_id' : 'NULL AS categoria_receita_id',
    has('centro_lucro_id') ? 'p.centro_lucro_id' : 'NULL AS centro_lucro_id',
    has('filial_id') ? 'p.filial_id' : 'NULL AS filial_id',
    has('unidade_negocio_id') ? 'p.unidade_negocio_id' : 'NULL AS unidade_negocio_id',
  ]
  const pedidoSql = `SELECT ${selectParts.join(', ')} FROM vendas.pedidos p WHERE p.id = $1 LIMIT 1`
  const pedidoRows = await runQuery<any>(pedidoSql, [pedidoId])
  const pedido = pedidoRows[0]
  if (!pedido) throw new Error('pedido not found')

  const tenantId = Number(pedido.tenant_id ?? 1)
  const clienteId = pedido.cliente_id !== null && pedido.cliente_id !== undefined ? Number(pedido.cliente_id) : null
  if (!clienteId) throw new Error('cliente_id inválido no pedido')

  const numeroDoc = (pedido.numero_pedido && pedido.numero_pedido.trim()) ? pedido.numero_pedido.trim() : `PV-${pedido.id}`
  const dataDoc = toISODate(pedido.data_pedido)
  const dataLanc = dataDoc
  const dataVenc = dataDoc
  const valorTotal = Math.abs(Number(pedido.valor_total || 0))
  const observacao = (pedido.descricao && pedido.descricao.trim()) || `Venda ${numeroDoc} (ID ${pedido.id})`

  // Idempotência: evita duplicar CR para mesmo documento
  const existingCr = await runQuery<{ id: number }>(
    `SELECT id FROM financeiro.contas_receber WHERE tenant_id = $1 AND numero_documento = $2 LIMIT 1`,
    [tenantId, numeroDoc]
  )
  if (existingCr[0]?.id) return { crId: Number(existingCr[0].id) }

  // Itens do pedido
  const itens = await runQuery<{
    id: number
    servico: string | null
    quantidade: number | null
    preco_unitario: number | null
    desconto: number | null
    subtotal: number | null
  }>(
    `SELECT pi.id,
            s.nome AS servico,
            pi.quantidade,
            pi.preco_unitario,
            COALESCE(pi.desconto,0) AS desconto,
            COALESCE(pi.subtotal,0) AS subtotal
       FROM vendas.pedidos_itens pi
       LEFT JOIN servicos.catalogo_servicos s ON s.id = pi.servico_id
      WHERE pi.pedido_id = $1
      ORDER BY pi.id ASC`,
    [pedidoId]
  )

  const result = await withTransaction(async (client) => {
    const ins = await client.query(
      `INSERT INTO financeiro.contas_receber (
         tenant_id, cliente_id, categoria_receita_id, centro_lucro_id, departamento_id, filial_id, unidade_negocio_id,
         numero_documento, tipo_documento, status,
         data_documento, data_lancamento, data_vencimento,
         valor_bruto, valor_desconto, valor_impostos, valor_liquido,
         observacao
       ) VALUES (
         $1,$2,$3,$4,$5,$6,$7,
         $8,$9,$10,
         $11,$12,$13,
         $14,0,0,$15,
         $16
       ) RETURNING id`,
      [
        tenantId,
        clienteId,
        (pedido as any).categoria_receita_id ?? null,
        (pedido as any).centro_lucro_id ?? null,
        null,
        (pedido as any).filial_id ?? null,
        (pedido as any).unidade_negocio_id ?? null,
        numeroDoc,
        'fatura',
        'pendente',
        dataDoc,
        dataLanc,
        dataVenc,
        valorTotal,
        valorTotal,
        observacao,
      ]
    )
    const crId = Number(ins.rows[0]?.id)
    if (!crId) throw new Error('Falha ao criar conta a receber')

    // Linhas
    const items = (itens.length ? itens : [{ id: 0, servico: 'Serviço', quantidade: 1, preco_unitario: valorTotal, desconto: 0, subtotal: valorTotal }])
    const cols = ['conta_receber_id','tipo_linha','descricao','quantidade','valor_unitario','valor_bruto','desconto','impostos','valor_liquido','categoria_financeira_id','departamento_id','centro_custo_id','unidade_negocio_id']
    const valuesSql: string[] = []
    const params: unknown[] = []
    let i = 1
    for (const it of items) {
      const q = Math.max(1, Number(it.quantidade || 1))
      const vu = Math.abs(Number(it.preco_unitario || 0))
      const bruto = q * vu
      const desc = Math.abs(Number(it.desconto || 0))
      const liquido = Math.abs(Number(it.subtotal || (bruto - desc)))
      const descr = (it.servico && String(it.servico)) || `Item ${it.id || ''}`.trim()
      valuesSql.push(`($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`)
      params.push(
        crId,
        'servico',
        descr,
        q,
        vu,
        bruto,
        desc,
        0,
        liquido,
        null,
        null,
        null,
        null,
      )
    }
    if (valuesSql.length) {
      await client.query(
        `INSERT INTO financeiro.contas_receber_linhas (${cols.join(',')}) VALUES ${valuesSql.join(',')}`,
        params
      )
    }

    return { crId }
  })

  return result
}

export const pedidoCriadoFn = inngest.createFunction(
  { id: 'vendas.pedido.criado->cr' },
  { event: 'vendas/pedido/criado' },
  async ({ event, step }) => {
    const pedidoId = Number((event.data as any)?.pedido_id)
    if (!Number.isFinite(pedidoId)) {
      await step.run('validate', async () => { throw new Error('pedido_id inválido') })
    }

    const result = await step.run('create-cr', async () => createCrFromPedido(pedidoId))

    try {
      await inngest.send({
        name: 'financeiro/contas_a_receber/criada',
        data: { conta_receber_id: result.crId },
      })
    } catch {}

    return { success: true, crId: result.crId }
  }
)
