import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

type ExportFormat = 'jsonl' | 'alpaca' | 'csv'

interface ExportFilters {
  status?: string[]
  category?: string
  lang?: string
  minRating?: number
  thumbsUpOnly?: boolean
  flaggedOnly?: boolean
  format: ExportFormat
}

const SYSTEM_PROMPT_PT = 'Você é o FitVerse AI, um assistente especializado em fitness, nutrição, saúde, emagrecimento e academia. Forneça conselhos seguros, motivadores e baseados em evidências.'
const SYSTEM_PROMPT_EN = 'You are FitVerse AI, an assistant specialized in fitness, nutrition, health, weight loss and gym training. Provide safe, motivating, evidence-based advice.'

function formatJSONL(messages: Array<{ user_message: string; ai_response: string; edited_response: string | null; user_context: Record<string, unknown>; user_message_lang: string }>): string {
  return messages.map((m) => {
    const systemPrompt = m.user_message_lang === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_PT
    const entry = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: m.user_message },
        { role: 'assistant', content: m.edited_response ?? m.ai_response },
      ],
    }
    return JSON.stringify(entry)
  }).join('\n')
}

function formatAlpaca(messages: Array<{ user_message: string; ai_response: string; edited_response: string | null; user_context: Record<string, unknown> }>): string {
  const entries = messages.map((m) => ({
    instruction: m.user_message,
    input: JSON.stringify(m.user_context),
    output: m.edited_response ?? m.ai_response,
  }))
  return JSON.stringify(entries, null, 2)
}

function formatCSV(messages: Array<{ id: string; user_message: string; ai_response: string; edited_response: string | null; category: string | null; user_rating: number | null; user_message_lang: string; created_at: string }>): string {
  const header = 'id,user_message,ai_response,category,rating,lang,created_at'
  const rows = messages.map((m) => {
    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`
    return [
      m.id,
      escape(m.user_message),
      escape(m.edited_response ?? m.ai_response),
      m.category ?? '',
      m.user_rating?.toString() ?? '',
      m.user_message_lang,
      m.created_at,
    ].join(',')
  })
  return [header, ...rows].join('\n')
}

export async function POST(req: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client not configured' }, { status: 500 })
  }

  try {
    const cookieStore = cookies()
    const token = cookieStore.get('sb-access-token')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const filters: ExportFilters = {
      status: body.status || ['approved', 'edited'],
      category: body.category || undefined,
      lang: body.lang || undefined,
      minRating: body.minRating || undefined,
      thumbsUpOnly: body.thumbsUpOnly || false,
      flaggedOnly: body.flaggedOnly || false,
      format: body.format || 'jsonl',
    }

    let query = supabaseAdmin
      .from('ai_messages')
      .select('id, user_message, ai_response, edited_response, category, user_rating, user_message_lang, user_context, created_at')
      .in('training_status', filters.status || ['approved', 'edited'])
      .order('created_at', { ascending: true })

    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category)
    }
    if (filters.lang && filters.lang !== 'all') {
      query = query.eq('user_message_lang', filters.lang)
    }
    if (filters.minRating) {
      query = query.gte('user_rating', filters.minRating)
    }
    if (filters.thumbsUpOnly) {
      query = query.eq('user_thumbs_up', true)
    }
    if (filters.flaggedOnly) {
      query = query.eq('user_flagged', true)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No messages found with the selected filters' }, { status: 404 })
    }

    let content: string
    let mimeType: string
    let extension: string

    switch (filters.format) {
      case 'jsonl':
        content = formatJSONL(data)
        mimeType = 'application/x-ndjson'
        extension = 'jsonl'
        break
      case 'alpaca':
        content = formatAlpaca(data)
        mimeType = 'application/json'
        extension = 'json'
        break
      case 'csv':
        content = formatCSV(data)
        mimeType = 'text/csv'
        extension = 'csv'
        break
      default:
        content = formatJSONL(data)
        mimeType = 'application/x-ndjson'
        extension = 'jsonl'
    }

    await supabaseAdmin
      .from('dataset_exports')
      .insert({
        format: filters.format,
        total_records: data.length,
        filters_applied: filters,
      })

    const filename = `fitverse-dataset-${Date.now()}.${extension}`

    return new NextResponse(content, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Dataset export error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    )
  }
}
