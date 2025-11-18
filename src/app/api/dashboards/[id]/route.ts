import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { data, error } = await supabase.from('apps.dashboards').select('*').eq('id', id).single()
  if (error) return Response.json({ success: false, error: error.message }, { status: 404 })
  return Response.json({ success: true, item: data })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await req.json()
  const fields: Record<string, unknown> = {}
  ;['title','description','sourcecode','visibility','version'].forEach(k => {
    if (body[k] !== undefined) fields[k] = body[k]
  })
  if (Object.keys(fields).length === 0) return Response.json({ success: false, error: 'Nada para atualizar' }, { status: 400 })
  const { data, error } = await supabase.from('apps.dashboards').update(fields).eq('id', id).select('*').single()
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
  return Response.json({ success: true, item: data })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params
  const { error } = await supabase.from('apps.dashboards').delete().eq('id', id)
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

