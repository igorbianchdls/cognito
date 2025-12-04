import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    // JSON mode (cabeçalho + itens/linhas) — alinhado ao padrão de Contas a Pagar
    if (contentType.includes('application/json')) {
      const body = await req.json() as Record<string, unknown>
      const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v))
      const toNum = (v: unknown) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }

      const cliente_id = toNum(body['cliente_id'])
      const categoria_id = body['categoria_id'] !== undefined && body['categoria_id'] !== null ? toNum(body['categoria_id']) : null
      const descricao = toStr(body['descricao'] || 'Conta a receber').trim()
      const statusRaw = toStr(body['status'] || 'pendente').trim().toLowerCase()
      const status = ['pendente', 'recebido', 'cancelado'].includes(statusRaw) ? statusRaw : 'pendente'
      const data_lancamento = toStr(body['data_lancamento'] || new Date().toISOString().slice(0,10))
      const data_vencimento = toStr(body['data_vencimento'] || '')
      const tenant_id = body['tenant_id'] !== undefined && body['tenant_id'] !== null ? toNum(body['tenant_id']) : 1
      const linhas = Array.isArray(body['linhas']) ? (body['linhas'] as Array<Record<string, unknown>>) : []
      const itensRaw = Array.isArray(body['itens']) ? (body['itens'] as Array<Record<string, unknown>>) : []
      // Dimensões: substituir centros_custo por centros_lucro
      const centro_lucro_id = body['centro_lucro_id'] !== undefined && body['centro_lucro_id'] !== null ? toNum(body['centro_lucro_id']) : null
      const departamento_id = body['departamento_id'] !== undefined && body['departamento_id'] !== null ? toNum(body['departamento_id']) : null
      const filial_id = body['filial_id'] !== undefined && body['filial_id'] !== null ? toNum(body['filial_id']) : null
      const projeto_id = body['projeto_id'] !== undefined && body['projeto_id'] !== null ? toNum(body['projeto_id']) : null

      let valor = body['valor'] !== undefined && body['valor'] !== null ? toNum(body['valor']) : NaN
      if (!cliente_id || cliente_id <= 0) return Response.json({ success: false, message: 'cliente_id é obrigatório' }, { status: 400 })
      if (!data_vencimento) return Response.json({ success: false, message: 'data_vencimento é obrigatório' }, { status: 400 })

      // Soma de itens quando valor do cabeçalho estiver ausente
      const somaItensEstimado = itensRaw.reduce((acc, it) => {
        const q = Number(it['quantidade'] ?? 1) || 1
        const vu = Number(it['valor_unitario'] ?? it['valor'] ?? 0) || 0
        const desc = Number(it['desconto'] ?? 0) || 0
        const acres = Number(it['acrescimo'] ?? 0) || 0
        const vt = Number(it['valor_total'] ?? (q * vu + acres - desc)) || 0
        return acc + vt
      }, 0)
      const somaLinhas = linhas.reduce((acc, ln) => acc + (Number(ln['valor_liquido'] ?? 0) || 0), 0)
      if (!Number.isFinite(valor)) {
        valor = Number.isFinite(somaItensEstimado) && somaItensEstimado > 0 ? somaItensEstimado : somaLinhas
      }

      const result = await withTransaction(async (client) => {
        // Cabeçalho
        const ins = await client.query(
          `INSERT INTO financeiro.lancamentos_financeiros (
             tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status,
             cliente_id, categoria_id, centro_lucro_id, departamento_id, filial_id, projeto_id
           ) VALUES ($1, 'conta_a_receber', $2, $3, $4, $5, $6,
                      $7, $8, $9, $10, $11, $12)
           RETURNING id`,
          [tenant_id, descricao, Math.abs(valor), data_lancamento, data_vencimento, status, cliente_id, categoria_id, centro_lucro_id, departamento_id, filial_id, projeto_id]
        )
        const id = Number(ins.rows[0]?.id)
        if (!id) throw new Error('Falha ao criar conta a receber')

        // Itens
        let itensCount = 0
        const normalizarItens = () => {
          const itensNorm = itensRaw.map((it, idx) => {
            const q = Number(it['quantidade'] ?? 1) || 1
            const vu = Number(it['valor_unitario'] ?? it['valor'] ?? 0) || 0
            const desc = Number(it['desconto'] ?? 0) || 0
            const acres = Number(it['acrescimo'] ?? 0) || 0
            const vt = it['valor_total'] !== undefined && it['valor_total'] !== null
              ? Number(it['valor_total'])
              : (q * vu + acres - (desc || 0))
            return {
              numero_item: Number(it['numero_item'] ?? idx + 1) || (idx + 1),
              descricao: toStr(it['descricao'] ?? descricao).trim(),
              quantidade: q,
              unidade: (it['unidade'] ?? null) as string | null,
              valor_unitario: vu,
              desconto: Number.isFinite(desc) ? desc : 0,
              acrescimo: Number.isFinite(acres) ? acres : 0,
              valor_total: Number.isFinite(vt) ? vt : 0,
              categoria_id: it['categoria_id'] !== undefined && it['categoria_id'] !== null ? Number(it['categoria_id']) : null,
              // Mantemos coluna centro_custo_id nos itens (schema existente), mesmo a dimensão do cabeçalho ser centro_lucro
              centro_custo_id: it['centro_custo_id'] !== undefined && it['centro_custo_id'] !== null ? Number(it['centro_custo_id']) : null,
              natureza_financeira_id: it['natureza_financeira_id'] !== undefined && it['natureza_financeira_id'] !== null ? Number(it['natureza_financeira_id']) : null,
              observacao: it['observacao'] ?? null,
            }
          })
          if (itensNorm.length > 0) return itensNorm
          return [{
            numero_item: 1,
            descricao,
            quantidade: 1,
            unidade: null as string | null,
            valor_unitario: Math.abs(valor),
            desconto: 0,
            acrescimo: 0,
            valor_total: Math.abs(valor),
            categoria_id: categoria_id,
            centro_custo_id: null as number | null,
            natureza_financeira_id: null as number | null,
            observacao: null as string | null,
          }]
        }

        const itens = normalizarItens()
        if (itens.length > 0) {
          const colsItens = [
            'lancamento_id','numero_item','descricao','quantidade','unidade',
            'valor_unitario','desconto','acrescimo','valor_total',
            'categoria_id','centro_custo_id','natureza_financeira_id','observacao'
          ]
          const valuesSqlItens: string[] = []
          const paramsItens: unknown[] = []
          let pi = 1
          for (const it of itens) {
            valuesSqlItens.push(`($${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++},$${pi++})`)
            paramsItens.push(
              id,
              it.numero_item,
              it.descricao,
              it.quantidade,
              it.unidade,
              it.valor_unitario,
              it.desconto,
              it.acrescimo,
              it.valor_total,
              it.categoria_id,
              it.centro_custo_id,
              it.natureza_financeira_id,
              it.observacao,
            )
          }
          await client.query(
            `INSERT INTO financeiro.lancamentos_financeiros_itens (${colsItens.join(',')})
             VALUES ${valuesSqlItens.join(',')}`,
            paramsItens
          )
          itensCount = itens.length
        }

        // Linhas (opcional/legado)
        if (linhas.length > 0) {
          const cols = ['lancamento_id','tipo_linha','numero_parcela','valor_bruto','juros','multa','desconto','valor_liquido','data_vencimento','data_pagamento','conta_financeira_id','extrato_transacao_id','status','observacao']
          const valuesSql: string[] = []
          const params: unknown[] = []
          let i = 1
          for (const ln of linhas) {
            valuesSql.push(`($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`)
            params.push(
              id,
              ln['tipo_linha'] ?? null,
              ln['numero_parcela'] ?? null,
              ln['valor_bruto'] ?? null,
              ln['juros'] ?? null,
              ln['multa'] ?? null,
              ln['desconto'] ?? null,
              ln['valor_liquido'] ?? null,
              ln['data_vencimento'] ?? null,
              ln['data_pagamento'] ?? null,
              ln['conta_financeira_id'] ?? null,
              ln['extrato_transacao_id'] ?? null,
              (typeof ln['status'] === 'string' ? String(ln['status']).toLowerCase() : 'pendente'),
              ln['observacao'] ?? null,
            )
          }
          await client.query(
            `INSERT INTO financeiro.lancamentos_financeiros_linhas (${cols.join(',')})
             VALUES ${valuesSql.join(',')}`,
            params
          )
        }

        return { id, itens_count: itensCount, linhas_count: linhas.length }
      })

      return Response.json({ success: true, id: result.id, itens_count: result.itens_count, linhas_count: result.linhas_count })
    }

    // FormData legacy mode (cabeçalho apenas)
    const form = await req.formData()

    const descricao = String(form.get('descricao') || '').trim()
    const valorRaw = String(form.get('valor') || '').trim()
    const data_lancamento = String(form.get('data_lancamento') || '').trim()
    const data_vencimento = String(form.get('data_vencimento') || '').trim()
    if (!descricao) return Response.json({ success: false, message: 'descricao é obrigatório' }, { status: 400 })
    if (!valorRaw) return Response.json({ success: false, message: 'valor é obrigatório' }, { status: 400 })
    if (!data_lancamento) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })
    if (!data_vencimento) return Response.json({ success: false, message: 'data_vencimento é obrigatório' }, { status: 400 })

    const valor = Number(valorRaw)
    if (Number.isNaN(valor)) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

    const tenant_id_raw = String(form.get('tenant_id') || '').trim()
    const entidade_id_raw = String(form.get('entidade_id') || '').trim() // cliente (compat)
    const cliente_id_raw = String(form.get('cliente_id') || '').trim() // novo schema
    const categoria_id_raw = String(form.get('categoria_id') || '').trim()
    const centro_lucro_id_raw = String(form.get('centro_lucro_id') || '').trim()
    const departamento_id_raw = String(form.get('departamento_id') || '').trim()
    const filial_id_raw = String(form.get('filial_id') || '').trim()
    const projeto_id_raw = String(form.get('projeto_id') || '').trim()
    const conta_financeira_id_raw = String(form.get('conta_financeira_id') || '').trim()
    const status = String(form.get('status') || '').trim() || 'pendente'

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    const entidade_id = entidade_id_raw ? Number(entidade_id_raw) : null
    const cliente_id = cliente_id_raw ? Number(cliente_id_raw) : (entidade_id ?? null)
    const categoria_id = categoria_id_raw ? Number(categoria_id_raw) : null
    const centro_lucro_id = centro_lucro_id_raw ? Number(centro_lucro_id_raw) : null
    const departamento_id = departamento_id_raw ? Number(departamento_id_raw) : null
    const filial_id = filial_id_raw ? Number(filial_id_raw) : null
    const projeto_id = projeto_id_raw ? Number(projeto_id_raw) : null
    const conta_financeira_id = conta_financeira_id_raw ? Number(conta_financeira_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO financeiro.lancamentos_financeiros (
           tenant_id, tipo, descricao, valor, data_lancamento, data_vencimento, status,
           entidade_id, cliente_id, categoria_id, conta_financeira_id,
           centro_lucro_id, departamento_id, filial_id, projeto_id
         ) VALUES ($1, 'conta_a_receber', $2, $3, $4, $5, $6,
                   $7, $8, $9, $10,
                   $11, $12, $13, $14)
         RETURNING id`,
        [tenant_id, descricao, Math.abs(valor), data_lancamento, data_vencimento, status, entidade_id, cliente_id, categoria_id, conta_financeira_id,
         centro_lucro_id, departamento_id, filial_id, projeto_id]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar conta a receber')
      return { id }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/contas-a-receber POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
