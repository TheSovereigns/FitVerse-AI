import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null

const allowedPlans = ['free', 'pro', 'premium', 'banned']

async function getAdmin(req: Request) {
  if (!supabaseAdmin) return null

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

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
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin is not configured' }, { status: 500 })
  }

  const admin = await getAdmin(req)
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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
