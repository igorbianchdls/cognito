import { createClient } from '@supabase/supabase-js'
import { withTransaction } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

function buildPath(lancId: number, fileName: string) {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const ext = fileName.includes('.') ? fileName.split('.').pop() : 'bin'
  const rand = Math.random().toString(36).slice(2)
  return `financeiro/lancamentos/${lancId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`
}

async function parseLancId(req: Request): Promise<number> {
  const url = new URL(req.url)
  const parts = url.pathname.split('/').filter(Boolean)
  const idx = parts.findIndex((p) => p === 'lancamentos')
  const idStr = idx >= 0 && parts[idx + 1] ? parts[idx + 1] : ''
  const id = Number(idStr)
  if (!id || Number.isNaN(id)) throw new Error('id inválido')
  return id
}

export async function POST(req: Request) {
  try {
    const lancId = await parseLancId(req)
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })

    const result = await withTransaction(async (client) => {
      // Verificar se já existe arquivo
      const cur = await client.query(`SELECT storage_key FROM financeiro.lancamentos_financeiros WHERE id = $1`, [lancId])
      const exists = (cur.rows?.[0]?.storage_key as string | null) || null
      if (exists) throw new Error('Lançamento já possui arquivo. Use PUT para substituir.')

      const storagePath = buildPath(lancId, file.name || 'arquivo')
      const ab = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, ab, { contentType: file.type || 'application/octet-stream', upsert: false })
      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`)

      await client.query(
        `UPDATE financeiro.lancamentos_financeiros 
            SET storage_key = $1, nome_arquivo = $2, content_type = $3, tamanho_bytes = $4
          WHERE id = $5`,
        [storagePath, file.name || 'arquivo', file.type || null, typeof file.size === 'number' ? file.size : null, lancId]
      )

      return { storagePath }
    })

    return Response.json({ success: true, storage_key: result.storagePath })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

export async function PUT(req: Request) {
  try {
    const lancId = await parseLancId(req)
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })

    const result = await withTransaction(async (client) => {
      const cur = await client.query(`SELECT storage_key FROM financeiro.lancamentos_financeiros WHERE id = $1`, [lancId])
      const oldKey = (cur.rows?.[0]?.storage_key as string | null) || null

      const storagePath = buildPath(lancId, file.name || 'arquivo')
      const ab = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, ab, { contentType: file.type || 'application/octet-stream', upsert: false })
      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`)

      await client.query(
        `UPDATE financeiro.lancamentos_financeiros 
            SET storage_key = $1, nome_arquivo = $2, content_type = $3, tamanho_bytes = $4
          WHERE id = $5`,
        [storagePath, file.name || 'arquivo', file.type || null, typeof file.size === 'number' ? file.size : null, lancId]
      )

      // Remover antigo, se existir (melhor esforço)
      if (oldKey) {
        try { await supabase.storage.from('documentos').remove([oldKey]) } catch {}
      }

      return { storagePath }
    })

    return Response.json({ success: true, storage_key: result.storagePath })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    const lancId = await parseLancId(req)

    await withTransaction(async (client) => {
      const cur = await client.query(`SELECT storage_key FROM financeiro.lancamentos_financeiros WHERE id = $1`, [lancId])
      const oldKey = (cur.rows?.[0]?.storage_key as string | null) || null
      if (oldKey) {
        const { error } = await supabase.storage.from('documentos').remove([oldKey])
        if (error) throw new Error(`Falha ao remover do storage: ${error.message}`)
      }
      await client.query(
        `UPDATE financeiro.lancamentos_financeiros
            SET storage_key = NULL, nome_arquivo = NULL, content_type = NULL, tamanho_bytes = NULL
          WHERE id = $1`,
        [lancId]
      )
    })

    return Response.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

