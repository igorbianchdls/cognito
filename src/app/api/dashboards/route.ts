import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const visibility = (searchParams.get('visibility') || '').trim()
  const limit = Number(searchParams.get('limit') || '20')
  const offset = Number(searchParams.get('offset') || '0')

  let query = supabase.from('apps.dashboards').select('id,title,description,visibility,version,created_at,updated_at', { count: 'estimated' })
  if (visibility) query = query.eq('visibility', visibility)
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`)
  if (!Number.isNaN(limit)) query = query.limit(limit)
  if (!Number.isNaN(offset)) query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
  return Response.json({ success: true, items: data, count: count ?? data?.length ?? 0 })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, description, sourcecode, visibility, version } = body || {}

    if (!title || typeof title !== 'string') return Response.json({ success: false, error: 'title é obrigatório' }, { status: 400 })
    if (!sourcecode || typeof sourcecode !== 'string') return Response.json({ success: false, error: 'sourcecode é obrigatório' }, { status: 400 })
    const vis = visibility || 'private'
    if (!['private','org','public'].includes(vis)) return Response.json({ success: false, error: 'visibility inválida' }, { status: 400 })
    const ver = Number.isFinite(Number(version)) && Number(version) > 0 ? Number(version) : 1

    const payload = { title, description: description || null, sourcecode, visibility: vis, version: ver }
    const { data, error } = await supabase.from('apps.dashboards').insert([payload]).select('*').single()
    if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
    return Response.json({ success: true, item: data }, { status: 201 })
  } catch (e) {
    return Response.json({ success: false, error: (e as Error).message || 'Erro ao criar' }, { status: 500 })
  }
}

