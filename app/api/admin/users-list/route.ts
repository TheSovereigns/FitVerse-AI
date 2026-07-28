import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const filter = searchParams.get('filter') || 'all'
  const search = searchParams.get('search') || ''

  let query = supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (filter === 'free') query = query.eq('plan', 'free')
  else if (filter === 'pro') query = query.eq('plan', 'pro')
  else if (filter === 'premium') query = query.eq('plan', 'premium')

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%`)
  }

  const { data, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data || [], total: count || 0 })
}
