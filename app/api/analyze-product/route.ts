import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Usando gemini-2.5-flash que tem capacidade de visão (multimodal)
const model = genAI ? genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
}) : null;

export async function POST(req: Request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!apiKey || !model) {
    return NextResponse.json({ error: 'Chave de API do Gemini não configurada.' }, { status: 500, headers });
  }

  try {
    const body = await req.json();
    const { imageData } = body;

    if (!imageData) {
      return NextResponse.json({ error: 'Imagem não fornecida.' }, { status: 400, headers });
    }

    // O imageData vem geralmente como "data:image/jpeg;base64,..."
    // Precisamos extrair apenas a parte base64
    const base64Data = imageData.includes('base64,') 
      ? imageData.split('base64,')[1] 
      : imageData;

    const prompt = `Analise esta imagem de alimento ou produto. 
    Retorne um JSON estrito (sem markdown) com:
    - productName: nome do produto
    - brand: marca ou 'Genérico'
    - macros: objeto com calories, protein, carbs, fat (números aproximados)
    - longevityScore: nota de 0 a 100 baseada em quão saudável é
    - positivePoints: array de strings
    - negativePoints: array de strings
    
    Se não for alimento, retorne erro.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpeza de markdown se houver
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysis = JSON.parse(text);

    return NextResponse.json(analysis, { headers });

  } catch (error) {
    console.error('Erro na análise de produto:', error);
    return NextResponse.json({ error: 'Falha ao analisar imagem.' }, { status: 500, headers });
  }
}