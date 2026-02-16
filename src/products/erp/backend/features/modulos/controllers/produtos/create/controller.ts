import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const view = String(form.get('view') || '').trim().toLowerCase()

    if (!view) {
      return Response.json({ success: false, message: 'view é obrigatório' }, { status: 400 })
    }

    const result = await withTransaction(async (client) => {
      if (view === 'produtos') {
        const nome = String(form.get('nome') || '').trim()
        if (!nome) throw new Error('nome é obrigatório')

        const descricao = String(form.get('descricao') || '').trim() || null
        const imagem_url = String(form.get('imagem_url') || '').trim() || null
        const ativo = String(form.get('ativo') || '').trim().toLowerCase() !== 'false'

        const insert = await client.query(
          `INSERT INTO produtos.produto (nome, descricao, imagem_url, ativo)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [nome, descricao, imagem_url, ativo]
        )
        const inserted = insert.rows[0] as { id: number | string }
        const id = Number(inserted?.id)
        if (!id) throw new Error('Falha ao criar produto')
        return { id }
      }

      if (view === 'variacoes') {
        const produto_pai_id_raw = String(form.get('produto_pai_id') || '').trim()
        const produto_pai_id = produto_pai_id_raw ? Number(produto_pai_id_raw) : null
        const sku = String(form.get('sku') || '').trim()
        if (!produto_pai_id) throw new Error('produto_pai_id é obrigatório')
        if (!sku) throw new Error('sku é obrigatório')

        const preco_base_raw = String(form.get('preco_base') || '').trim()
        const preco_base = preco_base_raw ? Number(preco_base_raw) : null
        const peso_kg_raw = String(form.get('peso_kg') || '').trim()
        const peso_kg = peso_kg_raw ? Number(peso_kg_raw) : null
        const altura_cm_raw = String(form.get('altura_cm') || '').trim()
        const altura_cm = altura_cm_raw ? Number(altura_cm_raw) : null
        const largura_cm_raw = String(form.get('largura_cm') || '').trim()
        const largura_cm = largura_cm_raw ? Number(largura_cm_raw) : null
        const profundidade_cm_raw = String(form.get('profundidade_cm') || '').trim()
        const profundidade_cm = profundidade_cm_raw ? Number(profundidade_cm_raw) : null
        const ativo = String(form.get('ativo') || '').trim().toLowerCase() !== 'false'

        const insert = await client.query(
          `INSERT INTO produtos.produto_variacoes (
             produto_pai_id, sku, preco_base, peso_kg, altura_cm, largura_cm, profundidade_cm, ativo
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [produto_pai_id, sku, preco_base, peso_kg, altura_cm, largura_cm, profundidade_cm, ativo]
        )
        const inserted = insert.rows[0] as { id: number | string }
        const id = Number(inserted?.id)
        if (!id) throw new Error('Falha ao criar variação')
        return { id }
      }

      if (view === 'dados-fiscais') {
        const variacao_id_raw = String(form.get('variacao_id') || '').trim()
        const variacao_id = variacao_id_raw ? Number(variacao_id_raw) : null
        if (!variacao_id) throw new Error('variacao_id é obrigatório')

        const ncm = String(form.get('ncm') || '').trim() || null
        const cest = String(form.get('cest') || '').trim() || null
        const cfop = String(form.get('cfop') || '').trim() || null
        const cst = String(form.get('cst') || '').trim() || null
        const origem = String(form.get('origem') || '').trim() || null
        const aliquota_icms_raw = String(form.get('aliquota_icms') || '').trim()
        const aliquota_icms = aliquota_icms_raw ? Number(aliquota_icms_raw) : null
        const aliquota_ipi_raw = String(form.get('aliquota_ipi') || '').trim()
        const aliquota_ipi = aliquota_ipi_raw ? Number(aliquota_ipi_raw) : null
        const aliquota_pis_raw = String(form.get('aliquota_pis') || '').trim()
        const aliquota_pis = aliquota_pis_raw ? Number(aliquota_pis_raw) : null
        const aliquota_cofins_raw = String(form.get('aliquota_cofins') || '').trim()
        const aliquota_cofins = aliquota_cofins_raw ? Number(aliquota_cofins_raw) : null
        const regime_tributario = String(form.get('regime_tributario') || '').trim() || null

        const insert = await client.query(
          `INSERT INTO produtos.produtos_fiscal (
             variacao_id, ncm, cest, cfop, cst, origem, aliquota_icms, aliquota_ipi, aliquota_pis, aliquota_cofins, regime_tributario
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [variacao_id, ncm, cest, cfop, cst, origem, aliquota_icms, aliquota_ipi, aliquota_pis, aliquota_cofins, regime_tributario]
        )
        const inserted = insert.rows[0] as { id: number | string }
        const id = Number(inserted?.id)
        if (!id) throw new Error('Falha ao criar dados fiscais')
        return { id }
      }

      throw new Error(`View não suportada: ${view}`)
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📦 API /api/modulos/produtos/create error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg, error: msg }, { status: 400 })
  }
}

