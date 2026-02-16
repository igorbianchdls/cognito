import { withTransaction } from '@/lib/postgres'

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const view = String(form.get('view') || '').trim().toLowerCase()

    if (!view) {
      return Response.json({ success: false, message: 'view é obrigatório' }, { status: 400 })
    }

    const result = await withTransaction(async (client) => {
      if (view === 'dados') {
        // Inserir empresa
        const razao_social = String(form.get('razao_social') || '').trim()
        if (!razao_social) {
          throw new Error('razao_social é obrigatório')
        }

        const nome_fantasia = String(form.get('nome_fantasia') || '').trim() || null
        const cnpj = String(form.get('cnpj') || '').trim() || null
        const inscricao_estadual = String(form.get('inscricao_estadual') || '').trim() || null
        const regime_tributario = String(form.get('regime_tributario') || '').trim() || null
        const endereco = String(form.get('endereco') || '').trim() || null
        const cidade = String(form.get('cidade') || '').trim() || null
        const estado = String(form.get('estado') || '').trim() || null
        const pais = String(form.get('pais') || '').trim() || null
        const ativo = String(form.get('ativo') || '').trim().toLowerCase() === 'true'

        const insertResult = await client.query(
          `INSERT INTO empresa.empresas (razao_social, nome_fantasia, cnpj, inscricao_estadual, regime_tributario, endereco, cidade, estado, pais, ativo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id`,
          [razao_social, nome_fantasia, cnpj, inscricao_estadual, regime_tributario, endereco, cidade, estado, pais, ativo]
        )

        const inserted = insertResult.rows[0] as { id: number | string }
        const id = Number(inserted?.id)
        if (!id) throw new Error('Falha ao criar empresa')

        return { id }
      } else if (view === 'filiais') {
        // Inserir filial
        const empresa_id_raw = String(form.get('empresa_id') || '').trim()
        const empresa_id = empresa_id_raw ? Number(empresa_id_raw) : null
        const codigo = String(form.get('codigo') || '').trim()
        const nome = String(form.get('nome') || '').trim()

        if (!empresa_id) throw new Error('empresa_id é obrigatório')
        if (!codigo) throw new Error('codigo é obrigatório')
        if (!nome) throw new Error('nome é obrigatório')

        const cnpj = String(form.get('cnpj') || '').trim() || null
        const inscricao_estadual = String(form.get('inscricao_estadual') || '').trim() || null
        const endereco = String(form.get('endereco') || '').trim() || null
        const cidade = String(form.get('cidade') || '').trim() || null
        const estado = String(form.get('estado') || '').trim() || null
        const pais = String(form.get('pais') || '').trim() || null
        const matriz = String(form.get('matriz') || '').trim().toLowerCase() === 'true'
        const ativo = String(form.get('ativo') || '').trim().toLowerCase() === 'true'

        const insertResult = await client.query(
          `INSERT INTO empresa.filiais (empresa_id, codigo, nome, cnpj, inscricao_estadual, endereco, cidade, estado, pais, matriz, ativo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING id`,
          [empresa_id, codigo, nome, cnpj, inscricao_estadual, endereco, cidade, estado, pais, matriz, ativo]
        )

        const inserted = insertResult.rows[0] as { id: number | string }
        const id = Number(inserted?.id)
        if (!id) throw new Error('Falha ao criar filial')

        return { id }
      } else if (view === 'departamentos') {
        // Inserir departamento
        const empresa_id_raw = String(form.get('empresa_id') || '').trim()
        const empresa_id = empresa_id_raw ? Number(empresa_id_raw) : null
        const codigo = String(form.get('codigo') || '').trim()
        const nome = String(form.get('nome') || '').trim()

        if (!empresa_id) throw new Error('empresa_id é obrigatório')
        if (!codigo) throw new Error('codigo é obrigatório')
        if (!nome) throw new Error('nome é obrigatório')

        const responsavel = String(form.get('responsavel') || '').trim() || null
        const ativo = String(form.get('ativo') || '').trim().toLowerCase() === 'true'

        const insertResult = await client.query(
          `INSERT INTO empresa.departamentos (empresa_id, codigo, nome, responsavel, ativo)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [empresa_id, codigo, nome, responsavel, ativo]
        )

        const inserted = insertResult.rows[0] as { id: number | string }
        const id = Number(inserted?.id)
        if (!id) throw new Error('Falha ao criar departamento')

        return { id }
      } else if (view === 'cargos') {
        // Inserir cargo
        const empresa_id_raw = String(form.get('empresa_id') || '').trim()
        const empresa_id = empresa_id_raw ? Number(empresa_id_raw) : null
        const departamento_id_raw = String(form.get('departamento_id') || '').trim()
        const departamento_id = departamento_id_raw ? Number(departamento_id_raw) : null
        const codigo = String(form.get('codigo') || '').trim()
        const nome = String(form.get('nome') || '').trim()

        if (!empresa_id) throw new Error('empresa_id é obrigatório')
        if (!codigo) throw new Error('codigo é obrigatório')
        if (!nome) throw new Error('nome é obrigatório')

        const nivel = String(form.get('nivel') || '').trim() || null
        const descricao = String(form.get('descricao') || '').trim() || null
        const ativo = String(form.get('ativo') || '').trim().toLowerCase() === 'true'

        const insertResult = await client.query(
          `INSERT INTO empresa.cargos (empresa_id, departamento_id, codigo, nome, nivel, descricao, ativo)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [empresa_id, departamento_id, codigo, nome, nivel, descricao, ativo]
        )

        const inserted = insertResult.rows[0] as { id: number | string }
        const id = Number(inserted?.id)
        if (!id) throw new Error('Falha ao criar cargo')

        return { id }
      } else {
        throw new Error(`View não suportada: ${view}`)
      }
    })

    return Response.json({ success: true, id: result.id })
  } catch (error) {
    console.error('📄 API /api/modulos/empresa/create error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg, error: msg }, { status: 400 })
  }
}
