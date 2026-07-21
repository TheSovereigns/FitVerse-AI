import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function PATCH(req: Request) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Servico indisponivel.' }, { status: 500 })
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Nao autorizado.' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Token invalido.' }, { status: 401 })
  }

  const { plan } = await req.json()
  if (plan !== 'free') {
    return NextResponse.json(
      { error: 'Use o checkout do Stripe para planos pagos.' },
      { status: 400 }
    )
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan: 'free',
      ads_enabled: true,
    })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, plan: 'free' })
}
