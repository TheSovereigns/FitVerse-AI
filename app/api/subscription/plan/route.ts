import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, authUser, getCorsHeaders } from '@/lib/supabase-server'

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders() })
}

export async function PATCH(req: NextRequest) {
  const headers = getCorsHeaders()
  const auth = await authUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers })

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 500, headers })
  }

  const { plan } = await req.json()
  if (plan !== 'free') {
    return NextResponse.json(
      { error: 'Use Stripe checkout for paid plans.' },
      { status: 400, headers }
    )
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      plan: 'free',
      ads_enabled: true,
    })
    .eq('id', auth.userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500, headers })
  }

  return NextResponse.json({ ok: true, plan: 'free' }, { headers })
}
