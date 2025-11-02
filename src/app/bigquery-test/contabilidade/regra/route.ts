import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Body = {
  tenant_id: number | string
  categoria_id: number | string
  origem?: 'conta_a_pagar' | 'pagamento_efetuado' | 'conta_a_receber' | 'pagamento_recebido'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Body>
    const tenant_id = body.tenant_id
    const categoria_id = body.categoria_id
    const origem = body.origem || 'conta_a_pagar'

    if (!tenant_id || !categoria_id) {
      return Response.json({ success: false, message: 'tenant_id e categoria_id são obrigatórios' }, { status: 400 })
    }

    const sql = `
      SELECT r.id,
             r.tenant_id,
             r.origem,
             r.subtipo,
             r.categoria_financeira_id,
             r.conta_debito_id,
             d.codigo AS debito_codigo,
             d.nome   AS debito_nome,
             r.conta_credito_id,
             c.codigo AS credito_codigo,
             c.nome   AS credito_nome,
             r.descricao
      FROM contabilidade.regras_contabeis r
      LEFT JOIN contabilidade.plano_contas d ON d.id = r.conta_debito_id
      LEFT JOIN contabilidade.plano_contas c ON c.id = r.conta_credito_id
      WHERE r.tenant_id = $1
        AND r.origem = $2
        AND r.categoria_financeira_id = $3
        AND r.automatico = TRUE
        AND r.ativo = TRUE
      ORDER BY r.id ASC
      LIMIT 1
    `
    const params = [tenant_id, origem, categoria_id]
    const rows = await runQuery<Record<string, unknown>>(sql, params)
    const regra = rows[0]
    if (!regra) {
      return Response.json({ success: false, message: 'Nenhuma regra contábil ativa encontrada para a origem/categoria informadas.' }, { status: 404 })
    }
    return Response.json({ success: true, regra, sql, params })
  } catch (e) {
    return Response.json({ success: false, message: e instanceof Error ? e.message : 'Erro desconhecido' }, { status: 500 })
  }
}

