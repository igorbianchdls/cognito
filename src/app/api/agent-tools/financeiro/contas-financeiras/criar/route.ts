import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, unknown>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })

    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const nome_conta = typeof payload.nome_conta === 'string' ? payload.nome_conta.trim() : ''
    if (!nome_conta) return Response.json({ ok: false, error: 'nome_conta é obrigatório' }, { status: 400 })

    const tipo_conta = typeof payload.tipo_conta === 'string' ? payload.tipo_conta.trim() : null
    const agencia = typeof payload.agencia === 'string' ? payload.agencia.trim() : null
    const numero_conta = typeof payload.numero_conta === 'string' ? payload.numero_conta.trim() : null
    const pix_chave = typeof payload.pix_chave === 'string' ? payload.pix_chave.trim() : null
    const saldo_inicial = payload.saldo_inicial !== undefined && payload.saldo_inicial !== null ? Number(payload.saldo_inicial) : 0
    const data_abertura = typeof payload.data_abertura === 'string' ? payload.data_abertura.trim() : null
    const ativo = payload.ativo === undefined ? true : Boolean(payload.ativo)

    // Duplicidade: por tenant+numero_conta (se informado) ou (tenant+nome_conta)
    if (numero_conta) {
      const dupNum = await runQuery<{ id: number }>(
        `SELECT id FROM financeiro.contas_financeiras WHERE tenant_id = $1 AND numero_conta = $2 LIMIT 1`,
        [tenantId, numero_conta]
      )
      if (dupNum.length) return Response.json({ ok: false, error: 'Conta financeira já existe para este número' }, { status: 409 })
    } else {
      const dupNome = await runQuery<{ id: number }>(
        `SELECT id FROM financeiro.contas_financeiras WHERE tenant_id = $1 AND LOWER(nome_conta) = LOWER($2) LIMIT 1`,
        [tenantId, nome_conta]
      )
      if (dupNome.length) return Response.json({ ok: false, error: 'Conta financeira já existe para este nome' }, { status: 409 })
    }

    const sql = `
      INSERT INTO financeiro.contas_financeiras
        (tenant_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, data_abertura, ativo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING id, tenant_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, data_abertura, ativo, criado_em, atualizado_em
    `.replace(/\n\s+/g, ' ').trim()
    const params = [tenantId, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, data_abertura, ativo]
    const [row] = await runQuery<Record<string, unknown>>(sql, params)
    if (!row) throw new Error('Falha ao criar conta financeira')
    return Response.json({ ok: true, result: { success: true, data: row, message: 'Conta financeira criada com sucesso' } })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}

