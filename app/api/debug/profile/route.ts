import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 })
  }

  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'No token' }, { status: 401 })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid token', authError }, { status: 401 })
  }

  const { data: byId } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: byEmail } = user.email
    ? await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
    : { data: [] }

  return NextResponse.json({
    authUser: { id: user.id, email: user.email },
    profileById: byId,
    profilesByEmail: byEmail,
    emailCount: byEmail?.length || 0,
  })
}
