import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Simulação de sessão de checkout para evitar erro se o Stripe não estiver configurado
    // Em produção, você usaria a biblioteca 'stripe' aqui
    const mockSessionId = 'cs_test_' + Math.random().toString(36).substring(7);
    
    return NextResponse.json({ sessionId: mockSessionId }, { headers });
  } catch (error) {
    console.error('Erro no checkout:', error);
    return NextResponse.json({ error: 'Erro ao criar sessão de pagamento' }, { status: 500, headers });
  }
}