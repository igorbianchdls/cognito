import { withTransaction } from '@/lib/postgres'
import { createLancamentoFinanceiroEContabil } from '@/services/contabilidade'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Linha = { conta_id: number | string; debito?: number | string; credito?: number | string; historico?: string | null }
type PostBody = {
  tenant_id?: number | string
  data_lancamento: string
  historico?: string | null
  conta_financeira_id?: number | string | null
  linhas: Linha[]
  // Modo financeiro opcional: cria financeiro + contábil automaticamente
  tipo?: 'conta_a_pagar' | 'conta_a_receber' | string
  categoria_id?: number | string
  entidade_id?: number | string | null
  valor?: number | string
  data_vencimento?: string
  status?: string | null
  descricao?: string | null
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<PostBody>
    const tipoRaw = String(body.tipo || '').trim().toLowerCase()
    const isModoFinanceiro = tipoRaw === 'conta_a_pagar' || tipoRaw === 'conta_a_receber'

    if (isModoFinanceiro) {
      const tenantId = body.tenant_id !== undefined && body.tenant_id !== null ? Number(body.tenant_id) : 1
      const categoriaId = body.categoria_id !== undefined && body.categoria_id !== null ? Number(body.categoria_id) : NaN
      const valor = body.valor !== undefined && body.valor !== null ? Number(body.valor) : NaN
      const dataLanc = String(body.data_lancamento || '').trim()
      const dataVenc = String(body.data_vencimento || '').trim() || dataLanc
      const descricao = body.descricao !== undefined && body.descricao !== null
        ? String(body.descricao).trim()
        : (body.historico !== undefined && body.historico !== null ? String(body.historico).trim() : `Lançamento ${tipoRaw}`)
      const entidadeId = body.entidade_id !== undefined && body.entidade_id !== null ? Number(body.entidade_id) : null
      const contaFinId = body.conta_financeira_id !== undefined && body.conta_financeira_id !== null ? Number(body.conta_financeira_id) : null
      const status = body.status !== undefined && body.status !== null ? String(body.status).trim().toLowerCase() : 'pendente'

      if (!dataLanc) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })
      if (!Number.isFinite(categoriaId) || categoriaId <= 0) return Response.json({ success: false, message: 'categoria_id é obrigatório' }, { status: 400 })
      if (!Number.isFinite(valor) || valor <= 0) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

      const created = await createLancamentoFinanceiroEContabil({
        tenant_id: tenantId,
        tipo: tipoRaw as 'conta_a_pagar' | 'conta_a_receber',
        descricao,
        valor,
        data_lancamento: dataLanc,
        data_vencimento: dataVenc,
        categoria_id: categoriaId,
        entidade_id: Number.isFinite(Number(entidadeId)) ? Number(entidadeId) : null,
        conta_financeira_id: Number.isFinite(Number(contaFinId)) ? Number(contaFinId) : null,
        status,
      })

      return Response.json({
        success: true,
        id: created.lcId,
        lancamento_financeiro_id: created.lfId,
        mode: 'financeiro+contabil',
      })
    }

    const dataLanc = String(body.data_lancamento || '').trim()
    const historico = body.historico !== undefined && body.historico !== null ? String(body.historico).trim() : null
    const tenantId = body.tenant_id !== undefined && body.tenant_id !== null ? Number(body.tenant_id) : 1
    const contaFinId = body.conta_financeira_id !== undefined && body.conta_financeira_id !== null ? Number(body.conta_financeira_id) : null
    const linhas = Array.isArray(body.linhas) ? body.linhas as Linha[] : []
    if (!dataLanc) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })
    if (!linhas.length) return Response.json({ success: false, message: 'Informe ao menos uma linha' }, { status: 400 })

    const norm = linhas.map((l, idx) => {
      const contaId = Number(l.conta_id)
      const deb = l.debito !== undefined && l.debito !== null ? Number(l.debito) : 0
      const cred = l.credito !== undefined && l.credito !== null ? Number(l.credito) : 0
      const hist = l.historico !== undefined && l.historico !== null ? String(l.historico).trim() : null
      if (!Number.isFinite(contaId) || contaId <= 0) throw new Error(`Linha ${idx + 1}: conta_id inválido`)
      if (!Number.isFinite(deb) || !Number.isFinite(cred)) throw new Error(`Linha ${idx + 1}: debito/credito inválidos`)
      return { conta_id: contaId, debito: deb, credito: cred, historico: hist }
    })

    const totalDeb = norm.reduce((a, l) => a + Number(l.debito || 0), 0)
    const totalCred = norm.reduce((a, l) => a + Number(l.credito || 0), 0)
    if (Number(totalDeb.toFixed(2)) !== Number(totalCred.toFixed(2))) {
      return Response.json({ success: false, message: 'Total de débitos deve ser igual ao total de créditos' }, { status: 400 })
    }

    const result = await withTransaction(async (client) => {
      const ins = await client.query(
        `INSERT INTO contabilidade.lancamentos_contabeis (
           tenant_id, data_lancamento, historico, conta_financeira_id, total_debitos, total_creditos
         ) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [tenantId, dataLanc, historico, contaFinId, totalDeb, totalCred]
      )
      const id = Number(ins.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar lançamento contábil')

      for (const l of norm) {
        await client.query(
          `INSERT INTO contabilidade.lancamentos_contabeis_linhas (lancamento_id, lancamento_contabil_id, conta_id, debito, credito, historico)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [id, id, l.conta_id, l.debito, l.credito, l.historico]
        )
      }

      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
