import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

async function getAdminUser(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return null

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return null

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return profile?.is_admin ? user : null
}

export async function GET(req: Request) {
  const admin = await getAdminUser(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { data: subs, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .order('created_at', { ascending: false })

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('plan')

  return NextResponse.json({ subscriptions: subs || [], profiles: profiles || [] })
}
