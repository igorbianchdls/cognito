import { createClient } from '@supabase/supabase-js'
import { withTransaction } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const view = String(form.get('view') || '').trim().toLowerCase()

    if (!view) {
      return Response.json({ success: false, message: 'view é obrigatório' }, { status: 400 })
    }

    let uploadedPath: string | null = null

    try {
      const result = await withTransaction(async (client) => {
        if (view === 'funcionarios') {
          // Inserir funcionário
          const nomecompleto = String(form.get('nomecompleto') || '').trim()
          const emailcorporativo = String(form.get('emailcorporativo') || '').trim()

          if (!nomecompleto) throw new Error('nomecompleto é obrigatório')
          if (!emailcorporativo) throw new Error('emailcorporativo é obrigatório')

          const telefonecorporativo = String(form.get('telefonecorporativo') || '').trim() || null
          const status = String(form.get('status') || '').trim() || 'ativo'
          const datanascimento = String(form.get('datanascimento') || '').trim() || null
          const cargoid_raw = String(form.get('cargoid') || '').trim()
          const cargoid = cargoid_raw ? Number(cargoid_raw) : null
          const departamentoid_raw = String(form.get('departamentoid') || '').trim()
          const departamentoid = departamentoid_raw ? Number(departamentoid_raw) : null
          const gestordiretoid_raw = String(form.get('gestordiretoid') || '').trim()
          const gestordiretoid = gestordiretoid_raw ? Number(gestordiretoid_raw) : null

          // Processar imagem (URL ou upload)
          let imagem_url: string | null = null
          const imagemUrlDirect = String(form.get('imagem_url') || '').trim()
          const file = form.get('file') as File | null

          if (imagemUrlDirect) {
            imagem_url = imagemUrlDirect
          } else if (file) {
            // Upload para Supabase Storage
            const now = new Date()
            const yyyy = now.getFullYear()
            const mm = String(now.getMonth() + 1).padStart(2, '0')
            const originalName = file.name || 'imagem'
            const ext = originalName.includes('.') ? originalName.split('.').pop() : 'jpg'
            const rand = Math.random().toString(36).slice(2)
            const storagePath = `rh/funcionarios/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`

            const ab = await file.arrayBuffer()
            const { error: uploadError } = await supabase.storage
              .from('documentos')
              .upload(storagePath, ab, { contentType: file.type || 'image/jpeg', upsert: false })

            if (uploadError) {
              throw new Error(`Falha no upload: ${uploadError.message}`)
            }

            uploadedPath = storagePath

            // Gerar URL pública
            const { data } = supabase.storage.from('documentos').getPublicUrl(storagePath)
            imagem_url = data.publicUrl
          }

          const insertResult = await client.query(
            `INSERT INTO recursoshumanos.funcionarios (nomecompleto, emailcorporativo, telefonecorporativo, status, datanascimento, cargoid, departamentoid, gestordiretoid, imagem_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING funcionarioid`,
            [nomecompleto, emailcorporativo, telefonecorporativo, status, datanascimento, cargoid, departamentoid, gestordiretoid, imagem_url]
          )

          const inserted = insertResult.rows[0] as { funcionarioid: number | string }
          const id = Number(inserted?.funcionarioid)
          if (!id) throw new Error('Falha ao criar funcionário')

          return { id }
        } else if (view === 'tipos-ausencia') {
          // Inserir tipo de ausência
          const nome = String(form.get('nome') || '').trim()
          if (!nome) throw new Error('nome é obrigatório')

          const descontadosaldodeferias = String(form.get('descontadosaldodeferias') || '').trim().toLowerCase() === 'true'

          const insertResult = await client.query(
            `INSERT INTO recursoshumanos.tiposdeausencia (nome, descontadosaldodeferias)
             VALUES ($1, $2)
             RETURNING tipoausenciaid`,
            [nome, descontadosaldodeferias]
          )

          const inserted = insertResult.rows[0] as { tipoausenciaid: number | string }
          const id = Number(inserted?.tipoausenciaid)
          if (!id) throw new Error('Falha ao criar tipo de ausência')

          return { id }
        } else if (view === 'contratos') {
          // Inserir contrato
          const funcionarioid_raw = String(form.get('funcionarioid') || '').trim()
          const funcionarioid = funcionarioid_raw ? Number(funcionarioid_raw) : null
          const tipodecontrato = String(form.get('tipodecontrato') || '').trim()
          const dataadmissao = String(form.get('dataadmissao') || '').trim()
          const status = String(form.get('status') || '').trim() || 'ativo'

          if (!funcionarioid) throw new Error('funcionarioid é obrigatório')
          if (!tipodecontrato) throw new Error('tipodecontrato é obrigatório')
          if (!dataadmissao) throw new Error('dataadmissao é obrigatório')

          const datademissao = String(form.get('datademissao') || '').trim() || null

          const insertResult = await client.query(
            `INSERT INTO recursoshumanos.contratos (funcionarioid, tipodecontrato, dataadmissao, datademissao, status)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING contratoid`,
            [funcionarioid, tipodecontrato, dataadmissao, datademissao, status]
          )

          const inserted = insertResult.rows[0] as { contratoid: number | string }
          const id = Number(inserted?.contratoid)
          if (!id) throw new Error('Falha ao criar contrato')

          return { id }
        } else if (view === 'historico-salarial') {
          // Inserir histórico salarial
          const contratoid_raw = String(form.get('contratoid') || '').trim()
          const contratoid = contratoid_raw ? Number(contratoid_raw) : null
          const salariobase_raw = String(form.get('salariobase') || '').trim()
          const salariobase = salariobase_raw ? Number(salariobase_raw) : null
          const tipodepagamento = String(form.get('tipodepagamento') || '').trim()
          const datainiciovigencia = String(form.get('datainiciovigencia') || '').trim()

          if (!contratoid) throw new Error('contratoid é obrigatório')
          if (!salariobase || salariobase <= 0) throw new Error('salariobase deve ser maior que zero')
          if (!tipodepagamento) throw new Error('tipodepagamento é obrigatório')
          if (!datainiciovigencia) throw new Error('datainiciovigencia é obrigatório')

          const datafimvigencia = String(form.get('datafimvigencia') || '').trim() || null

          const insertResult = await client.query(
            `INSERT INTO recursoshumanos.historicosalarial (contratoid, salariobase, tipodepagamento, datainiciovigencia, datafimvigencia)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING historicosalarialid`,
            [contratoid, salariobase, tipodepagamento, datainiciovigencia, datafimvigencia]
          )

          const inserted = insertResult.rows[0] as { historicosalarialid: number | string }
          const id = Number(inserted?.historicosalarialid)
          if (!id) throw new Error('Falha ao criar histórico salarial')

          return { id }
        } else {
          throw new Error(`View não suportada: ${view}`)
        }
      })

      return Response.json({ success: true, id: result.id })
    } catch (err) {
      // Se upload foi feito, tentar limpar
      if (uploadedPath) {
        await supabase.storage.from('documentos').remove([uploadedPath]).catch(() => {})
      }
      const msg = err instanceof Error ? err.message : String(err)
      return Response.json({ success: false, message: msg, error: msg }, { status: 400 })
    }
  } catch (error) {
    console.error('📄 API /api/modulos/rh/create error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: 'Erro interno', error: msg }, { status: 500 })
  }
}
