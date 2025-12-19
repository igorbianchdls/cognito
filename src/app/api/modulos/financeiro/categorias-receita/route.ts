import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type CategoriaReceitaPayload = {
  tenant_id?: number | string
  codigo?: string | null
  nome: string
  descricao?: string | null
  tipo?: 'operacional' | 'financeira' | 'outras'
  plano_conta_id?: number | string | null
  ativo?: boolean
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CategoriaReceitaPayload>
    const nome = String(body.nome || '').trim()
    if (!nome) return Response.json({ success: false, message: 'nome é obrigatório' }, { status: 400 })

    const tenantId = body.tenant_id !== undefined && body.tenant_id !== null ? Number(body.tenant_id) : 1
    const codigo = body.codigo ? String(body.codigo).trim() : null
    const descricao = body.descricao ? String(body.descricao).trim() : null
    const tipoRaw = body.tipo ? String(body.tipo).trim().toLowerCase() : 'operacional'
    const tipo: 'operacional' | 'financeira' | 'outras' = (['operacional','financeira','outras'] as const).includes(tipoRaw as any) ? (tipoRaw as any) : 'operacional'
    const planoId = body.plano_conta_id !== undefined && body.plano_conta_id !== null ? Number(body.plano_conta_id) : null
    const ativo = body.ativo === undefined ? true : Boolean(body.ativo)

    // Inserção
    const sql = `
      INSERT INTO financeiro.categorias_receita
        (tenant_id, codigo, nome, descricao, tipo, natureza, plano_conta_id, ativo)
      VALUES ($1,$2,$3,$4,$5,'receita',$6,$7)
      RETURNING id, tenant_id, codigo, nome, descricao, tipo, natureza, plano_conta_id, ativo, criado_em, atualizado_em
    `.replace(/\n\s+/g, ' ').trim()
    const params = [tenantId, codigo, nome, descricao, tipo, planoId, ativo]
    const [row] = await runQuery<Record<string, unknown>>(sql, params)
    if (!row) throw new Error('Falha ao criar categoria de receita')
    return Response.json({ success: true, row })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/categorias-receita POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

