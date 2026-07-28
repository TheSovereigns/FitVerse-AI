import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/auth-helpers'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: '2024-06-20' })
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req)
  if (admin instanceof NextResponse) return admin

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
