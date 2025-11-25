import { createClient } from '@supabase/supabase-js'
import { withTransaction } from '@/lib/postgres'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseId(req: Request): number {
  const { pathname } = new URL(req.url)
  const parts = pathname.split('/').filter(Boolean)
  const idx = parts.findIndex((p) => p === 'clientes')
  const idStr = idx >= 0 ? parts[idx + 1] : ''
  const id = Number(idStr)
  if (!id || Number.isNaN(id)) throw new Error('ID inválido')
  return id
}

function buildPath(clienteId: number, fileName: string) {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const ext = (fileName && fileName.includes('.')) ? fileName.split('.').pop() : 'bin'
  const rand = Math.random().toString(36).slice(2)
  return `entidades/clientes/${clienteId}/${yyyy}/${mm}/${Date.now()}-${rand}.${ext}`
}

export async function POST(req: Request) {
  try {
    const clienteId = parseId(req)
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return Response.json({ success: false, message: 'Arquivo (file) é obrigatório' }, { status: 400 })
    if (!file.type?.startsWith('image/')) return Response.json({ success: false, message: 'Somente imagens são permitidas' }, { status: 400 })
    const MAX = 5 * 1024 * 1024
    if (typeof file.size === 'number' && file.size > MAX) return Response.json({ success: false, message: 'Arquivo maior que 5MB' }, { status: 400 })

    const result = await withTransaction(async (client) => {
      // Buscar imagem atual (para remover depois)
      const cur = await client.query(`SELECT imagem_url FROM entidades.clientes WHERE id = $1`, [clienteId])
      const currentUrl = (cur.rows?.[0]?.imagem_url as string | null) || null

      const storagePath = buildPath(clienteId, file.name || 'avatar')
      const ab = await file.arrayBuffer()
      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(storagePath, ab, { contentType: file.type || 'application/octet-stream', upsert: false })
      if (uploadError) throw new Error(`Falha no upload: ${uploadError.message}`)

      // URL pública
      const { data: pub } = supabase.storage.from('documentos').getPublicUrl(storagePath)
      const publicUrl = pub?.publicUrl || null
      if (!publicUrl) throw new Error('Falha ao obter URL pública')

      await client.query(`UPDATE entidades.clientes SET imagem_url = $1 WHERE id = $2`, [publicUrl, clienteId])

      return { publicUrl, currentUrl }
    })

    // Melhor esforço: remover anterior se era do mesmo bucket
    if (result.currentUrl && result.currentUrl.includes('/storage/v1/object/public/documentos/')) {
      const prefix = '/storage/v1/object/public/documentos/'
      const idx = result.currentUrl.indexOf(prefix)
      if (idx >= 0) {
        const key = result.currentUrl.substring(idx + prefix.length)
        try { await supabase.storage.from('documentos').remove([key]) } catch {}
      }
    }

    return Response.json({ success: true, imagem_url: result.publicUrl })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erro desconhecido'
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

