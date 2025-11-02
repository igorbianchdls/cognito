import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const maxDuration = 300

type ListedFile = {
  path: string
  name: string
  size?: number
  updated_at?: string
  mimeType?: string
}

type StorageListEntry = {
  name: string
  id?: string
  updated_at?: string
  created_at?: string
  metadata?: { size?: number; mimetype?: string } | null
  type?: 'file' | 'folder'
}

async function listRecursive(bucket: string, prefix: string): Promise<ListedFile[]> {
  const out: ListedFile[] = []

  // List entries at this prefix
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) throw error
  const entries: StorageListEntry[] = (data ?? []) as unknown as StorageListEntry[]

  for (const entry of entries) {
    if (entry.name.endsWith('/')) continue
    if (!entry.metadata && !entry.updated_at && entry.name && entry.name.indexOf('.') === -1) {
      // It's likely a folder in older SDKs – recurse
      const child = await listRecursive(bucket, `${prefix ? prefix + '/' : ''}${entry.name}`)
      out.push(...child)
      continue
    }

    if (!('id' in entry) && entry.name && entry.name.indexOf('.') === -1 && entry.updated_at === undefined) {
      // Folder-like – recurse
      const child = await listRecursive(bucket, `${prefix ? prefix + '/' : ''}${entry.name}`)
      out.push(...child)
      continue
    }

    // File-like entry
    const fullPath = `${prefix ? prefix + '/' : ''}${entry.name}`
    out.push({
      path: fullPath,
      name: entry.name,
      size: entry.metadata?.size ?? undefined,
      updated_at: entry.updated_at ?? undefined,
      mimeType: entry.metadata?.mimetype ?? undefined,
    })
  }

  // Also handle folder entries explicitly if returned with type property
  const folders = entries.filter((e) => e.type === 'folder').map((e) => e.name)
  for (const folder of folders) {
    const child = await listRecursive(bucket, `${prefix ? prefix + '/' : ''}${folder}`)
    out.push(...child)
  }

  return out
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const prefix = (searchParams.get('prefix') || 'uploads').replace(/^\/+|\/+$/g, '')

    // Recursively list files under prefix
    const files = await listRecursive('documentos', prefix)

    // Sign URLs
    const rows = await Promise.all(files.map(async (f) => {
      const { data: signed } = await supabase.storage.from('documentos').createSignedUrl(f.path, 60 * 5)
      return {
        nome_arquivo: f.name,
        tipo_arquivo: f.mimeType ?? null,
        tamanho_bytes: f.size ?? null,
        criado_em: f.updated_at ?? null,
        signed_url: signed?.signedUrl,
      }
    }))

    return Response.json({ success: true, rows, total: rows.length, prefix })
  } catch (error) {
    console.error('Erro storage-list:', error)
    return Response.json({ success: false, message: 'Erro ao listar arquivos do storage', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}
