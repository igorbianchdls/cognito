import { withTransaction } from '@/lib/postgres'
import { inngest } from '@/lib/inngest'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || ''
    // JSON mode: create header + lines in a single transaction
    if (contentType.includes('application/json')) {
      const body = await req.json() as Record<string, unknown>
      const toStr = (v: unknown) => (v === null || v === undefined ? '' : String(v))
      const toNum = (v: unknown) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : NaN
      }
      const fornecedor_id = toNum(body['fornecedor_id'])
      const categoria_id = body['categoria_id'] !== undefined && body['categoria_id'] !== null ? toNum(body['categoria_id']) : null
      const descricao = toStr(body['descricao'] || 'Conta a pagar').trim()
      const statusRaw = toStr(body['status'] || 'pendente').trim().toLowerCase()
      const status = ['pendente', 'pago', 'cancelado'].includes(statusRaw) ? statusRaw : 'pendente'
      const data_lancamento = toStr(body['data_lancamento'] || new Date().toISOString().slice(0,10))
      const data_documento = toStr((body as any)['data_emissao'] || (body as any)['data_documento'] || '')
      const numero_documento = toStr((body as any)['numero_nota_fiscal'] || (body as any)['numero_documento'] || '')
      const tipo_documento = toStr((body as any)['tipo_documento'] || '')
      const data_vencimento = toStr(body['data_vencimento'] || '')
      const tenant_id = body['tenant_id'] !== undefined && body['tenant_id'] !== null ? toNum(body['tenant_id']) : 1
      const linhas = Array.isArray(body['linhas']) ? (body['linhas'] as Array<Record<string, unknown>>) : []
      // Novo: itens detalhados do documento (notas, serviços, etc.)
      const itensRaw = Array.isArray(body['itens']) ? (body['itens'] as Array<Record<string, unknown>>) : []
      // Dims adicionais (opcionais) no cabeçalho
      const centro_custo_id = body['centro_custo_id'] !== undefined && body['centro_custo_id'] !== null ? toNum(body['centro_custo_id']) : null
      const departamento_id = body['departamento_id'] !== undefined && body['departamento_id'] !== null ? toNum(body['departamento_id']) : null
      const filial_id = body['filial_id'] !== undefined && body['filial_id'] !== null ? toNum(body['filial_id']) : null
      const projeto_id = body['projeto_id'] !== undefined && body['projeto_id'] !== null ? toNum(body['projeto_id']) : null
      const unidade_negocio_id = (body as any)['unidade_negocio_id'] !== undefined && (body as any)['unidade_negocio_id'] !== null ? toNum((body as any)['unidade_negocio_id']) : null
      let valor = body['valor'] !== undefined && body['valor'] !== null ? toNum(body['valor']) : NaN

      if (!fornecedor_id || fornecedor_id <= 0) return Response.json({ success: false, message: 'fornecedor_id é obrigatório' }, { status: 400 })
      if (!data_vencimento) return Response.json({ success: false, message: 'data_vencimento é obrigatório' }, { status: 400 })

      // If items or lines provided, compute sums when header valor is missing
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
        // Header (novo schema: financeiro.contas_pagar)
        const ins = await client.query(
          `INSERT INTO financeiro.contas_pagar (
             tenant_id,
             fornecedor_id,
             categoria_despesa_id,
             centro_custo_id,
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
            fornecedor_id,
            categoria_id,
            centro_custo_id,
            departamento_id,
            filial_id,
            unidade_negocio_id,
            numero_documento,  // NOT NULL na tabela; aceita string vazia
            tipo_documento || null,
            status,
            data_documento || null,
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
        if (!id) throw new Error('Falha ao criar conta a pagar')

        // Novo: Itens do lançamento (financeiro.lancamentos_financeiros_itens)
        let itensCount = 0
        try {
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
                centro_custo_id: it['centro_custo_id'] !== undefined && it['centro_custo_id'] !== null ? Number(it['centro_custo_id']) : null,
                natureza_financeira_id: it['natureza_financeira_id'] !== undefined && it['natureza_financeira_id'] !== null ? Number(it['natureza_financeira_id']) : null,
                observacao: it['observacao'] ?? null,
              }
            })
            if (itensNorm.length > 0) return itensNorm
            // Se não vierem itens, gera 1 item padrão com o valor do cabeçalho
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
            const cols = [
              'conta_pagar_id',
              'tipo_linha',
              'descricao',
              'quantidade',
              'valor_unitario',
              'valor_bruto',
              'desconto',
              'impostos',
              'valor_liquido',
              'categoria_despesa_id',
              'departamento_id',
              'centro_custo_id',
              'unidade_negocio_id'
            ]
            const valuesSql: string[] = []
            const params: unknown[] = []
            let i = 1
            for (const it of itens) {
              const q = Number(it.quantidade || 1) || 1
              const vu = Number(it.valor_unitario || 0) || 0
              const acres = Number((it as any).acrescimo || 0) || 0
              const desc = Number(it.desconto || 0) || 0
              const bruto = q * vu + acres
              const liquido = Number(it.valor_total || bruto - desc) || (bruto - desc)
              valuesSql.push(`($${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++},$${i++})`)
              params.push(
                id,                            // conta_pagar_id
                'item',                        // tipo_linha
                it.descricao || descricao,     // descricao
                q,                             // quantidade
                vu,                            // valor_unitario
                bruto,                         // valor_bruto
                desc,                          // desconto
                0,                             // impostos (não detalhado no input atual)
                liquido,                       // valor_liquido
                (it.categoria_id ?? categoria_id) || null,        // categoria_despesa_id
                departamento_id || null,       // departamento_id (do cabeçalho)
                (it.centro_custo_id ?? centro_custo_id) || null,  // centro_custo_id
                unidade_negocio_id || null     // unidade_negocio_id (do cabeçalho)
              )
            }
            await client.query(
              `INSERT INTO financeiro.contas_pagar_linhas (${cols.join(',')})
               VALUES ${valuesSql.join(',')}`,
              params
            )
            itensCount = itens.length
          }
        } catch (e) {
          // Se falhar a inserção de itens por qualquer motivo, aborta transação via throw
          throw e
        }

        // Lines
        if (false && linhas.length > 0) {
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

        return { id, tenant_id, fornecedor_id, categoria_id, conta_financeira_id, numero_documento, data_lancamento, valor_liquido: Math.abs(valor), descricao, linhas_count: itensCount, itens_count: itensCount }
      })

      // Dispara evento para criação automática de lançamento contábil (Inngest)
      try {
        await inngest.send({
          name: 'financeiro/contas_a_pagar/criada',
          data: {
            conta_pagar_id: result.id,
            tenant_id: result.tenant_id,
            fornecedor_id: result.fornecedor_id,
            categoria_despesa_id: result.categoria_id,
            conta_financeira_id: result.conta_financeira_id,
            numero_documento: result.numero_documento,
            data_lancamento: result.data_lancamento,
            valor_liquido: result.valor_liquido,
            descricao: result.descricao,
            subtipo: 'principal',
          },
        })
      } catch (e) {
        console.warn('Falha ao enviar evento Inngest contas_a_pagar.criada', e)
      }

      return Response.json({ success: true, id: result.id, linhas_count: result.linhas_count, itens_count: result.itens_count })
    }

    // Default legacy FormData mode (header only)
    const form = await req.formData()

    const descricao = String(form.get('descricao') || '').trim()
    const numero_documento = String(form.get('numero_documento') || '').trim()
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

    const tenant_id_raw = String(form.get('tenant_id') || '').trim()
    const entidade_id_raw = String(form.get('entidade_id') || '').trim() // fornecedor (compat)
    const fornecedor_id_raw = String(form.get('fornecedor_id') || '').trim() // novo schema
    const categoria_id_raw = String(form.get('categoria_id') || '').trim()
    const conta_financeira_id_raw = String(form.get('conta_financeira_id') || '').trim()
    const centro_custo_id_raw = String(form.get('centro_custo_id') || '').trim()
    const departamento_id_raw = String(form.get('departamento_id') || '').trim()
    const filial_id_raw = String(form.get('filial_id') || '').trim()
    const projeto_id_raw = String(form.get('projeto_id') || '').trim()
    const status = String(form.get('status') || '').trim() || 'pendente'

    const tenant_id = tenant_id_raw ? Number(tenant_id_raw) : 1
    const entidade_id = entidade_id_raw ? Number(entidade_id_raw) : null
    const fornecedor_id = fornecedor_id_raw ? Number(fornecedor_id_raw) : (entidade_id ?? null)
    const categoria_id = categoria_id_raw ? Number(categoria_id_raw) : null
    const conta_financeira_id = conta_financeira_id_raw ? Number(conta_financeira_id_raw) : null
    const centro_custo_id = centro_custo_id_raw ? Number(centro_custo_id_raw) : null
    const departamento_id = departamento_id_raw ? Number(departamento_id_raw) : null
    const filial_id = filial_id_raw ? Number(filial_id_raw) : null
    const projeto_id = projeto_id_raw ? Number(projeto_id_raw) : null

    const result = await withTransaction(async (client) => {
      const insert = await client.query(
        `INSERT INTO financeiro.contas_pagar (
           tenant_id,
           fornecedor_id,
           categoria_despesa_id,
           centro_custo_id,
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
          fornecedor_id,
          categoria_id,
          centro_custo_id,
          departamento_id,
          filial_id,
          null,
          numero_documento,        // NOT NULL
          null,                    // tipo_documento
          status,
          null,
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
      if (!id) throw new Error('Falha ao criar conta a pagar')
      return { id, tenant_id, fornecedor_id, categoria_id, conta_financeira_id, numero_documento, data_lancamento, valor_liquido: Math.abs(valor), descricao }
    })

    // Dispara evento Inngest também para modo FormData
    try {
      await inngest.send({
        name: 'financeiro/contas_a_pagar/criada',
        data: {
          conta_pagar_id: result.id,
          tenant_id: result.tenant_id,
          fornecedor_id: result.fornecedor_id,
          categoria_despesa_id: result.categoria_id,
          conta_financeira_id: result.conta_financeira_id,
          numero_documento: result.numero_documento,
          data_lancamento: result.data_lancamento,
          valor_liquido: result.valor_liquido,
          descricao: result.descricao,
          subtipo: 'principal',
        },
      })
    } catch (e) {
      console.warn('Falha ao enviar evento Inngest (FormData) contas_a_pagar.criada', e)
    }

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('💸 API /api/modulos/financeiro/contas-a-pagar POST error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}
