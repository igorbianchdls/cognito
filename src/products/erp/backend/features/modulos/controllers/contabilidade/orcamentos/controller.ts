import { NextRequest } from 'next/server'
import { withTransaction } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      nome,
      ano,
      versao,
      status,
      descricao,
      linhas = [],
    } = body || {}

    if (!nome || !ano) {
      return Response.json({ success: false, message: 'Campos obrigatórios: nome, ano' }, { status: 400 })
    }

    const out = await withTransaction(async (client) => {
      const hdrSql = `INSERT INTO contabilidade.orcamentos_contabeis (nome, ano, versao, status, descricao)
                      VALUES ($1,$2,$3,$4,$5) RETURNING id`
      const hdrRes = await client.query(hdrSql, [String(nome), Number(ano), versao ?? null, status ?? null, descricao ?? null])
      const orcamentoId: number = Number(hdrRes.rows[0]?.id)

      if (Array.isArray(linhas)) {
        const linSql = `INSERT INTO contabilidade.orcamentos_contabeis_linhas (orcamento_id, mes, conta_id, valor_debito, valor_credito, observacao)
                        VALUES ($1,$2,$3,$4,$5,$6)`
        for (const l of linhas) {
          const mes = Number(l?.mes)
          const contaId = Number(l?.conta_id)
          const deb = l?.valor_debito != null ? Number(l.valor_debito) : 0
          const cred = l?.valor_credito != null ? Number(l.valor_credito) : 0
          const obs = l?.observacao ? String(l.observacao) : null
          if (!Number.isFinite(mes) || !Number.isFinite(contaId)) continue
          await client.query(linSql, [orcamentoId, mes, contaId, deb, cred, obs])
        }
      }

      return { orcamentoId }
    })

    return Response.json({ success: true, id: out.orcamentoId })
  } catch (error) {
    console.error('POST /api/modulos/contabilidade/orcamentos error:', error)
    return Response.json({ success: false, message: error instanceof Error ? error.message : 'Erro interno' }, { status: 500 })
  }
}

