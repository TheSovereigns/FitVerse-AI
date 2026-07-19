import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

async function getAdminUser(req: Request, supabaseAdmin: SupabaseClient) {
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

export async function GET(req: Request) {
  const stripe = getStripe()
  if (!stripe) {
    return NextResponse.json(
      { success: false, error: 'Stripe nao configurado.' },
      { status: 500 }
    )
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'Servidor nao configurado.' },
      { status: 500 }
    )
  }

  const adminUser = await getAdminUser(req, supabaseAdmin)
  if (!adminUser) {
    return NextResponse.json(
      { success: false, error: 'Nao autorizado.' },
      { status: 401 }
    )
  }

  try {
    const balance = await stripe.balance.retrieve()
    const total = balance.available.reduce((acc, b) => acc + b.amount, 0) +
      balance.pending.reduce((acc, b) => acc + b.amount, 0)

    return NextResponse.json({
      success: true,
      totalAmount: total / 100,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao consultar Stripe.'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
