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

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: totalUsers },
    { count: usersToday },
    { count: activeSubscriptions },
    { count: freeUsers },
    { count: premiumUsers },
    { data: profiles },
    { data: subscriptions },
    { data: topUsersData }
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', today),
    supabaseAdmin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'free'),
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('plan', 'premium'),
    supabaseAdmin.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
    supabaseAdmin.from('subscriptions').select('amount_brl, amount_usd').eq('status', 'active'),
    supabaseAdmin.from('top_users_view').select('*').limit(5)
  ])

  const mrrBRL = subscriptions?.reduce((sum: number, s: Record<string, unknown>) => sum + ((s as { amount_brl?: number }).amount_brl || 0), 0) || 0
  const mrrUSD = subscriptions?.reduce((sum: number, s: Record<string, unknown>) => sum + ((s as { amount_usd?: number }).amount_usd || 0), 0) || 0

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    usersToday: usersToday || 0,
    activeSubscriptions: activeSubscriptions || 0,
    mrrBRL,
    mrrUSD,
    freeUsers: freeUsers || 0,
    premiumUsers: premiumUsers || 0,
    profiles: profiles || [],
    topUsers: topUsersData || []
  })
}
