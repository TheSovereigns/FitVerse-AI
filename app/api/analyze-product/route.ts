import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const PLAN_LIMITS = {
  free: { scansPerDay: 5 },
  pro: { scansPerDay: 50 },
  premium: { scansPerDay: Infinity },
};

async function checkScanLimit(userId: string, plan: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase!
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.scansPerDay ?? 5;
  return (count ?? 0) < limit;
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
});
    
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysis = JSON.parse(text);

    const transformed = {
      ...analysis,
      alerts: analysis.negativePoints?.map((desc: string) => ({
        title: desc.split(' - ')[0] || desc,
        description: desc.split(' - ').slice(1).join(' - ') || desc
      })) || [],
      insights: analysis.positivePoints?.map((desc: string) => ({
        description: desc
      })) || []
    };

    await supabase!.from('scans').insert({
      user_id: user.id,
      product_name: analysis.productName,
      score: analysis.longevityScore,
      image_url: null,
    });

    return NextResponse.json(transformed, { headers });

  } catch (error) {
    console.error('Erro na análise de produto:', error);
    return NextResponse.json({ error: 'Falha ao analisar imagem.' }, { status: 500, headers });
  }
}
