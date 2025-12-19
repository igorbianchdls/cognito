import { withTransaction } from '@/lib/postgres'
import { inngest } from '@/lib/inngest'
import { inngest } from '@/lib/inngest'

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
      const data_documento = toStr((body as any)['data_emissao'] || (body as any)['data_documento'] || '')
      const numero_documento = toStr((body as any)['numero_nota_fiscal'] || (body as any)['numero_documento'] || 'DOC')
      const sanitizeTipoDocumento = (v: string): string => {
        const s = (v || '').trim().toLowerCase()
        if (['nota_fiscal','nota fiscal','nf','nfe','nf-e','nfs-e','nfse'].includes(s)) return 'nota_fiscal'
        if (['boleto','boleto_bancario','boleto bancario'].includes(s)) return 'boleto'
        if (['fatura','invoice'].includes(s)) return 'fatura'
        if (['duplicata'].includes(s)) return 'duplicata'
        if (['contrato'].includes(s)) return 'contrato'
        if (['recibo'].includes(s)) return 'recibo'
        return 'fatura'
      }
      const tipo_documento = sanitizeTipoDocumento(toStr((body as any)['tipo_documento'] || 'fatura'))
      const conta_financeira_id = body['conta_financeira_id'] !== undefined && body['conta_financeira_id'] !== null ? toNum(body['conta_financeira_id']) : null
      const data_vencimento = toStr(body['data_vencimento'] || '')
      const tenant_id = body['tenant_id'] !== undefined && body['tenant_id'] !== null ? toNum(body['tenant_id']) : 1
      const linhas = Array.isArray(body['linhas']) ? (body['linhas'] as Array<Record<string, unknown>>) : []
      const itensRaw = Array.isArray(body['itens']) ? (body['itens'] as Array<Record<string, unknown>>) : []
      // Dimensões: substituir centros_custo por centros_lucro
      const centro_lucro_id = body['centro_lucro_id'] !== undefined && body['centro_lucro_id'] !== null ? toNum(body['centro_lucro_id']) : null
      const departamento_id = body['departamento_id'] !== undefined && body['departamento_id'] !== null ? toNum(body['departamento_id']) : null
      const filial_id = body['filial_id'] !== undefined && body['filial_id'] !== null ? toNum(body['filial_id']) : null
      const projeto_id = body['projeto_id'] !== undefined && body['projeto_id'] !== null ? toNum(body['projeto_id']) : null
      const unidade_negocio_id = (body as any)['unidade_negocio_id'] !== undefined && (body as any)['unidade_negocio_id'] !== null ? toNum((body as any)['unidade_negocio_id']) : null

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
        // Cabeçalho (novo schema: financeiro.contas_receber)
        const ins = await client.query(
          `INSERT INTO financeiro.contas_receber (
             tenant_id,
             cliente_id,
             categoria_receita_id,
             centro_lucro_id,
             departamento_id,
             filial_id,
             unidade_negocio_id,
             numero_documento,
             tipo_documento,
             status,
             data_documento,
             data_lancamento,
             data_vencimento,
             valor_bruto,
             valor_desconto,
             valor_impostos,
             valor_liquido,
             observacao
           ) VALUES (
             $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
           )
           RETURNING id`,
          [
            tenant_id,
            cliente_id,
            categoria_id,
            centro_lucro_id,
            departamento_id,
            filial_id,
            unidade_negocio_id,
            numero_documento,
            tipo_documento,
            status,
            (data_documento || data_lancamento),
            data_lancamento,
            data_vencimento,
            Math.abs(valor),
            0,
            0,
            Math.abs(valor),
            descricao,
          ]
        )
        const id = Number(ins.rows[0]?.id)
        if (!id) throw new Error('Falha ao criar conta a receber')

        // Itens -> contas_receber_linhas (tipo_linha='item')
        let itensCount = 0
        const itensList = ((): Array<{
          descricao: string | null
          quantidade: number
          valor_unitario: number
          desconto: number
          acrescimo: number
          valor_total: number
          categoria_id: number | null
          observacao: string | null
        }> => {
          const list = itensRaw.map((it) => {
            const q = Number(it['quantidade'] ?? 1) || 1
            const vu = Number(it['valor_unitario'] ?? it['valor'] ?? 0) || 0
            const desc = Number(it['desconto'] ?? 0) || 0
            const acres = Number(it['acrescimo'] ?? 0) || 0
            const vt = it['valor_total'] !== undefined && it['valor_total'] !== null
              ? Number(it['valor_total'])
              : (q * vu + acres - (desc || 0))
            return {
              descricao: toStr(it['descricao'] ?? descricao).trim() || null,
              quantidade: q,
              valor_unitario: vu,
              desconto: Number.isFinite(desc) ? desc : 0,
              acrescimo: Number.isFinite(acres) ? acres : 0,
              valor_total: Number.isFinite(vt) ? vt : 0,
              categoria_id: it['categoria_id'] !== undefined && it['categoria_id'] !== null ? Number(it['categoria_id']) : (categoria_id as number | null),
              observacao: (it['observacao'] ?? null) as string | null,
            }
          })
          if (list.length > 0) return list
          return [{
            descricao,
            quantidade: 1,
            valor_unitario: Math.abs(valor),
            desconto: 0,
            acrescimo: 0,
            valor_total: Math.abs(valor),
            categoria_id: categoria_id as number | null,
            observacao: null,
          }]
        })()

        if (itensList.length > 0) {
          const cols = [
            'conta_receber_id',
            'tipo_linha',
            'descricao',
            'quantidade',
            'valor_unitario',
            'valor_bruto',
            'desconto',
            'impostos',
            'valor_liquido',
            'categoria_financeira_id',
            'departamento_id',
            'centro_custo_id',
            'unidade_negocio_id'
          ]
          const valuesSql: string[] = []
          const params: unknown[] = []
          let i = 1
          for (const it of itensList) {
            const bruto = Number(it.quantidade) * Number(it.valor_unitario) + Number(it.acrescimo || 0)
            const liquido = Number(it.valor_total || bruto - Number(it.desconto || 0))
            valuesSql.push(`($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`)
            params.push(
              id,                          // conta_receber_id
              'item',                      // tipo_linha
              it.descricao,                // descricao
              it.quantidade,               // quantidade
              it.valor_unitario,           // valor_unitario
              bruto,                       // valor_bruto
              it.desconto || 0,            // desconto
              0,                           // impostos (não detalhado)
              liquido,                     // valor_liquido
              it.categoria_id || null,     // categoria_financeira_id
              departamento_id || null,     // departamento_id
              null,                        // centro_custo_id (não aplicável em CR)
              unidade_negocio_id || null   // unidade_negocio_id
            )
          }
          await client.query(
            `INSERT INTO financeiro.contas_receber_linhas (${cols.join(',')})
             VALUES ${valuesSql.join(',')}`,
            params
          )
          itensCount = itensList.length
        }

        // Sem inserção de linhas legadas (parcelas)

        // Atualiza conta_financeira_id se informado
        if (conta_financeira_id !== null) {
          try { await client.query(`UPDATE financeiro.contas_receber SET conta_financeira_id = $1 WHERE id = $2`, [conta_financeira_id, id]) } catch {}
        }
        return { id, itens_count: itensCount, linhas_count: itensCount }
      })

      // Evento para LC (Inngest)
      try { await inngest.send({ name: 'financeiro/contas_a_receber/criada', data: { conta_receber_id: result.id } }) } catch {}
      return Response.json({ success: true, id: result.id, itens_count: result.itens_count, linhas_count: result.linhas_count })
    }

    // FormData legacy mode (cabeçalho apenas)
    const form = await req.formData()

    const descricao = String(form.get('descricao') || '').trim()
    const numero_documento = String(form.get('numero_documento') || '').trim()
    const sanitizeTipoDocumento = (v: string): string => {
      const s = (v || '').trim().toLowerCase()
      if (['nota_fiscal','nota fiscal','nf','nfe','nf-e','nfs-e','nfse'].includes(s)) return 'nota_fiscal'
      if (['boleto','boleto_bancario','boleto bancario'].includes(s)) return 'boleto'
      if (['fatura','invoice'].includes(s)) return 'fatura'
      if (['duplicata'].includes(s)) return 'duplicata'
      if (['contrato'].includes(s)) return 'contrato'
      if (['recibo'].includes(s)) return 'recibo'
      return 'fatura'
    }
    const tipo_documento = sanitizeTipoDocumento(String(form.get('tipo_documento') || 'fatura'))
    const valorRaw = String(form.get('valor') || '').trim()
    const data_lancamento = String(form.get('data_lancamento') || '').trim()
    const data_vencimento = String(form.get('data_vencimento') || '').trim()
    if (!descricao) return Response.json({ success: false, message: 'descricao é obrigatório' }, { status: 400 })
    if (!numero_documento) return Response.json({ success: false, message: 'numero_documento é obrigatório' }, { status: 400 })
    if (!valorRaw) return Response.json({ success: false, message: 'valor é obrigatório' }, { status: 400 })
    if (!data_lancamento) return Response.json({ success: false, message: 'data_lancamento é obrigatório' }, { status: 400 })
    if (!data_vencimento) return Response.json({ success: false, message: 'data_vencimento é obrigatório' }, { status: 400 })

    const valor = Number(valorRaw)
    if (Number.isNaN(valor)) return Response.json({ success: false, message: 'valor inválido' }, { status: 400 })

    const tenant_id_raw = String(form.get('tenant_id') || '1').trim()
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
        `INSERT INTO financeiro.contas_receber (
           tenant_id,
           cliente_id,
           categoria_receita_id,
           centro_lucro_id,
           departamento_id,
           filial_id,
           unidade_negocio_id,
           numero_documento,
           tipo_documento,
           status,
           data_documento,
           data_lancamento,
           data_vencimento,
           valor_bruto,
           valor_desconto,
           valor_impostos,
           valor_liquido,
           observacao
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
         )
         RETURNING id`,
        [
          tenant_id,
          cliente_id,
          categoria_id,
          centro_lucro_id,
          departamento_id,
          filial_id,
          null,
          numero_documento,
          tipo_documento,
          status,
          data_lancamento,
          data_lancamento,
          data_vencimento,
          Math.abs(valor),
          0,
          0,
          Math.abs(valor),
          descricao,
        ]
      )
      const id = Number(insert.rows[0]?.id)
      if (!id) throw new Error('Falha ao criar conta a receber')
      if (conta_financeira_id !== null) {
        try { await client.query(`UPDATE financeiro.contas_receber SET conta_financeira_id = $1 WHERE id = $2`, [conta_financeira_id, id]) } catch {}
      }
      return { id }
    })

    try { await inngest.send({ name: 'financeiro/contas_a_receber/criada', data: { conta_receber_id: result.id } }) } catch {}
    // Evento para LC (Inngest)
    try { await inngest.send({ name: 'financeiro/contas_a_receber/criada', data: { conta_receber_id: result.id } }) } catch {}
    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/contas-a-receber POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
