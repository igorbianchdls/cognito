import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { withTransaction } from '@/lib/postgres'

export const runtime = 'nodejs'

type JsonMap = Record<string, unknown>

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeStatus(value: unknown): string {
  const raw = toText(value).toLowerCase()
  if (!raw) return 'pendente'
  if (raw === 'concluido' || raw === 'aprovado' || raw === 'pendente' || raw === 'cancelado') return raw
  return 'pendente'
}

function toDateOnly(value: unknown, fallback: string): string {
  const txt = toText(value).slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(txt) ? txt : fallback
}

function parseTenant(req: NextRequest, payload: JsonMap): number {
  const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
  if (Number.isFinite(hdrTenant) && hdrTenant > 0) return hdrTenant
  const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
  if (Number.isFinite(envTenant) && envTenant > 0) return envTenant
  const bodyTenant = numberOrNull(payload.tenant_id)
  if (bodyTenant && bodyTenant > 0) return Math.trunc(bodyTenant)
  return 1
}

export async function POST(req: NextRequest) {
  try {
    const payload = toObj(await req.json().catch(() => ({})))
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const tenantId = parseTenant(req, payload)
    const nowIso = new Date().toISOString().slice(0, 10)

    const clienteId = numberOrNull(payload.cliente_id)
    if (!clienteId || clienteId <= 0) {
      return Response.json({ ok: false, error: 'cliente_id é obrigatório' }, { status: 400 })
    }

    const dataPedido = toDateOnly(payload.data_pedido, nowIso)
    const dataDocumento = toDateOnly(payload.data_documento, dataPedido)
    const dataLancamento = toDateOnly(payload.data_lancamento, dataDocumento)
    const dataVencimento = toDateOnly(payload.data_vencimento, dataPedido)
    const status = normalizeStatus(payload.status)
    const observacoes = toText(payload.observacoes) || null
    const descricao = toText(payload.descricao) || null

    const linhasRaw = Array.isArray(payload.linhas)
      ? payload.linhas
      : (Array.isArray(payload.itens) ? payload.itens : [])
    const linhas = linhasRaw
      .map((row) => toObj(row))
      .filter((row) => Object.keys(row).length > 0)

    let subtotalFromLines = 0
    let descontoFromLines = 0
    for (const row of linhas) {
      const qtd = Math.max(0, Number(row.quantidade ?? 1))
      const unit = Math.max(0, Number(row.preco_unitario ?? row.valor_unitario ?? 0))
      const desconto = Math.max(0, Number(row.desconto ?? 0))
      subtotalFromLines += (qtd * unit)
      descontoFromLines += desconto
    }

    const descontoTotal = numberOrNull(payload.desconto_total) ?? descontoFromLines
    const subtotal = numberOrNull(payload.subtotal) ?? (subtotalFromLines > 0 ? subtotalFromLines : (numberOrNull(payload.valor_total) ?? 0))
    const valorTotal = numberOrNull(payload.valor_total) ?? Math.max(0, subtotal - descontoTotal)

    if (!Number.isFinite(valorTotal) || valorTotal <= 0) {
      return Response.json({ ok: false, error: 'valor_total inválido' }, { status: 400 })
    }

    const result = await withTransaction(async (client) => {
      const canalVendaId = numberOrNull(payload.canal_venda_id)
      let canalId = canalVendaId
      if (!canalId) {
        const canalRows = await client.query(`SELECT id FROM vendas.canais_venda ORDER BY id ASC LIMIT 1`)
        canalId = canalRows.rows[0] ? Number(canalRows.rows[0].id) : null
      }

      const vendedorId = numberOrNull(payload.vendedor_id)
      const territorioId = numberOrNull(payload.territorio_id)
      const centroLucroId = numberOrNull(payload.centro_lucro_id)
      const campanhaVendaId = numberOrNull(payload.campanha_venda_id)
      const filialId = numberOrNull(payload.filial_id)
      const unidadeNegocioId = numberOrNull(payload.unidade_negocio_id)
      const salesOfficeId = numberOrNull(payload.sales_office_id)
      const categoriaReceitaId = numberOrNull(payload.categoria_receita_id)
      const departamentoId = numberOrNull(payload.departamento_id)

      const insertPedido = await client.query(
        `INSERT INTO vendas.pedidos
          (tenant_id, cliente_id, vendedor_id, territorio_id, canal_venda_id, data_pedido, status, subtotal, desconto_total, valor_total, observacoes, descricao, centro_lucro_id, campanha_venda_id, filial_id, unidade_negocio_id, sales_office_id, categoria_receita_id, data_documento, data_lancamento, data_vencimento, departamento_id, criado_em, atualizado_em)
         VALUES
          ($1,$2,$3,$4,$5,$6::date,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::date,$20::date,$21::date,$22,now(),now())
         RETURNING id`,
        [
          tenantId,
          clienteId,
          vendedorId,
          territorioId,
          canalId,
          dataPedido,
          status,
          subtotal,
          descontoTotal,
          valorTotal,
          observacoes,
          descricao,
          centroLucroId,
          campanhaVendaId,
          filialId,
          unidadeNegocioId,
          salesOfficeId,
          categoriaReceitaId,
          dataDocumento,
          dataLancamento,
          dataVencimento,
          departamentoId,
        ]
      )

      const pedidoId = Number(insertPedido.rows[0]?.id)
      if (!pedidoId) throw new Error('Falha ao criar pedido')

      if (linhas.length > 0) {
        let defaultServicoId = numberOrNull(payload.servico_id)
        if (!defaultServicoId) {
          const srvRows = await client.query(`SELECT id FROM servicos.catalogo_servicos ORDER BY id ASC LIMIT 1`)
          defaultServicoId = srvRows.rows[0] ? Number(srvRows.rows[0].id) : null
        }
        if (!defaultServicoId) throw new Error('Nenhum serviço disponível para pedidos_itens')

        for (const row of linhas) {
          const quantidade = Math.max(1, Number(row.quantidade ?? 1))
          const precoUnitario = Math.max(0, Number(row.preco_unitario ?? row.valor_unitario ?? 0))
          const desconto = Math.max(0, Number(row.desconto ?? 0))
          const subtotalLinha = Math.max(0, Number(row.subtotal ?? (quantidade * precoUnitario - desconto)))
          const produtoId = numberOrNull(row.produto_id)
          const servicoId = numberOrNull(row.servico_id) ?? defaultServicoId

          await client.query(
            `INSERT INTO vendas.pedidos_itens
              (tenant_id, pedido_id, produto_id, quantidade, preco_unitario, desconto, subtotal, servico_id, criado_em, atualizado_em)
             VALUES
              ($1,$2,$3,$4,$5,$6,$7,$8,now(),now())`,
            [tenantId, pedidoId, produtoId, quantidade, precoUnitario, desconto, subtotalLinha, servicoId]
          )
        }
      }

      return { id: pedidoId, itens: linhas.length }
    })

    return Response.json({
      ok: true,
      result: {
        success: true,
        data: result,
        message: 'Pedido de venda criado',
      },
    })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
