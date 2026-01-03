import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message } = body;

    // Simulação de resposta. Em um cenário real, você conectaria com OpenAI/Gemini aqui.
    const reply = `Olá! Sou o FitVerse AI. Recebi sua mensagem: "${message}". Como posso ajudar com seus treinos ou dieta hoje?`;

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Erro na API do chatbot:', error);
    return NextResponse.json(
      { error: 'Falha ao processar mensagem' },
      { status: 500 }
    );
  }
}