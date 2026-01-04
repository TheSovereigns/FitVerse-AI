import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API Key não configurada" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // CORREÇÃO: Usando o modelo correto gemini-1.5-flash.
    // Modelos inexistentes (como 2.5) causam erro 500 imediato.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const body = await req.json();
    const foodInput = body.productName || body.foodName || "Alimento desconhecido";

    const prompt = `
      Atue como um nutricionista esportivo (Bio-Scanner). Analise o alimento: "${foodInput}".
      
      Retorne APENAS um objeto JSON válido (sem markdown) com a seguinte estrutura exata:
      {
        "productName": "Nome formatado do produto",
        "score": 0, // Nota de 0 a 100 (saudabilidade)
        "attentionPoints": ["Ponto negativo 1", "Ponto negativo 2", "Ponto negativo 3"],
        "benefits": ["Benefício 1", "Benefício 2", "Benefício 3"],
        "goalAlignment": 0 // Compatibilidade com dieta fitness (0-100)
      }

      Seja rigoroso com ultraprocessados e destaque benefícios reais de alimentos naturais.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpeza de segurança para garantir que o JSON seja válido
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const data = JSON.parse(cleanedText);
      return NextResponse.json(data);
    } catch (parseError) {
      console.error("Erro ao processar JSON da IA:", cleanedText);
      return NextResponse.json({ error: "A IA retornou um formato inválido." }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Erro na rota analyze-food:", error);
    // Retorna o erro real para facilitar o debug no frontend
    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 });
  }
}