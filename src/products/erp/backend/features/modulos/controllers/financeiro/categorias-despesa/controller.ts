import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type CategoriaDespesaPayload = {
  tenant_id?: number | string
  codigo?: string | null
  nome: string
  descricao?: string | null
  tipo?: 'operacional' | 'financeira' | 'outras'
  plano_conta_id?: number | string
  ativo?: boolean
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CategoriaDespesaPayload>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const tenantId = body.tenant_id !== undefined && body.tenant_id !== null ? Number(body.tenant_id) : 1
    const codigo = body.codigo ? String(body.codigo).trim() : null
    const descricao = body.descricao ? String(body.descricao).trim() : null
    const tipoRaw = body.tipo ? String(body.tipo).trim().toLowerCase() : 'operacional'
    const tipo: 'operacional' | 'financeira' | 'outras' = (['operacional','financeira','outras'] as const).includes(tipoRaw as any) ? (tipoRaw as any) : 'operacional'
    const planoIdRaw = body.plano_conta_id
    const planoId = Number(planoIdRaw)
    if (planoIdRaw === undefined || planoIdRaw === null || !Number.isFinite(planoId) || planoId <= 0) {
      return Response.json({ success: false, message: 'plano_conta_id é obrigatório e deve ser válido' }, { status: 400 })
    }
    const planoRows = await runQuery<{ id: number }>(
      `SELECT id
         FROM contabilidade.plano_contas
        WHERE id = $1
          AND aceita_lancamento = TRUE
          AND tipo_conta IN ('Custo','Despesa')
        LIMIT 1`,
      [planoId]
    )
    if (!planoRows.length) {
      return Response.json(
        { success: false, message: 'plano_conta_id inválido para categoria de despesa (use conta lançável de Custo/Despesa)' },
        { status: 400 }
      )
    }
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)

    const sql = `
      INSERT INTO financeiro.categorias_despesa
        (tenant_id, codigo, nome, descricao, tipo, natureza, plano_conta_id, ativo)
      VALUES ($1,$2,$3,$4,$5,'despesa',$6,$7)
      RETURNING id, tenant_id, codigo, nome, descricao, tipo, natureza, plano_conta_id, ativo, criado_em, atualizado_em
    `.replace(/\n\s+/g, ' ').trim()
    const params = [tenantId, codigo, nome, descricao, tipo, planoId, ativo]
    const [row] = await runQuery<Record<string, unknown>>(sql, params)
    if (!row) throw new Error('Falha ao criar categoria de despesa')
    return Response.json({ success: true, row })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/categorias-despesa POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
