import { NextRequest } from 'next/server'
import { createLancamentoFinanceiroEContabil } from '@/services/contabilidade'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, any>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const fornecedor_id = payload.fornecedor_id !== undefined ? Number(payload.fornecedor_id) : null
    const categoria_id = Number(payload.categoria_id)
    const valor = Number(payload.valor)
    const descricao = typeof payload.descricao === 'string' ? payload.descricao : ''
    const data_lancamento = typeof payload.data_emissao === 'string' ? payload.data_emissao : (typeof payload.data_lancamento === 'string' ? payload.data_lancamento : new Date().toISOString().slice(0, 10))
    const data_vencimento = typeof payload.data_vencimento === 'string' ? payload.data_vencimento : data_lancamento
    const conta_financeira_id = payload.conta_financeira_id !== undefined ? Number(payload.conta_financeira_id) : null
    if (!Number.isFinite(categoria_id) || !Number.isFinite(valor)) return Response.json({ ok: false, error: 'categoria_id e valor são obrigatórios' }, { status: 400 })

    const result = await createLancamentoFinanceiroEContabil({
      tenant_id: tenantId,
      tipo: 'conta_a_pagar',
      descricao,
      valor: Math.abs(valor),
      data_lancamento,
      data_vencimento,
      categoria_id,
      entidade_id: fornecedor_id,
      conta_financeira_id,
    })

    return Response.json({
      ok: true,
      result: {
        success: true,
        data: { id: result.lfId, lancamento_contabil_id: result.lcId },
        message: 'Conta a pagar criada com lançamento contábil'
      }
    })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
