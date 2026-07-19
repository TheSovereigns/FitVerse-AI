import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const allowedPlans = ['free', 'pro', 'premium', 'banned']

async function getAdmin(req: Request, supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

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

export async function PATCH(req: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  const admin = await getAdmin(req, supabaseAdmin)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const { userId, updates } = await req.json()
  if (!userId || !updates || typeof updates !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const safeUpdates: Record<string, unknown> = {}

  if ('is_admin' in updates) {
    safeUpdates.is_admin = Boolean(updates.is_admin)
  }

  if ('plan' in updates) {
    if (!allowedPlans.includes(updates.plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    safeUpdates.plan = updates.plan
    safeUpdates.ads_enabled = updates.plan === 'free'
  }

  if (Object.keys(safeUpdates).length === 0) {
    return NextResponse.json({ error: 'No supported updates provided' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update(safeUpdates)
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
