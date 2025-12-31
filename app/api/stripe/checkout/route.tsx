import { NextResponse } from 'next/server'
import Stripe from 'stripe'

// Inicializamos o Stripe dentro ou fora, mas garantindo que a chave exista
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia', 
})

export async function POST(req: Request) {
  try {
    const stripeSecret = process.env.STRIPE_SECRET_KEY
    const proPriceId = process.env.STRIPE_PRO_PRICE_ID
    const premiumPriceId = process.env.STRIPE_PREMIUM_PRICE_ID

    // 1. Verificação Robusta de Configuração
    if (!stripeSecret || !proPriceId || !premiumPriceId) {
      console.error('ERRO: Chaves do Stripe não encontradas no .env.local');
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta (Chaves ausentes no .env.local)' },
        { status: 500 }
      );
    }

    // 2. Receber dados do frontend
    const { plan, userEmail } = await req.json()

    // 3. Seleção do Price ID
    let priceId: string
    if (plan === 'pro') {
      priceId = proPriceId
    } else if (plan === 'premium') {
      priceId = premiumPriceId
    } else {
      return NextResponse.json(
        { error: 'Plano inválido ou não especificado.' },
        { status: 400 }
      );
    }

    // 4. Criação da Sessão de Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId.trim(), // .trim() remove espaços acidentais
          quantity: 1,
        },
      ],
      mode: 'subscription',
      // Redirecionamentos após o pagamento
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?canceled=true`,
      customer_email: userEmail,
    })

    return NextResponse.json({ sessionId: session.id })

  } catch (err: any) {
    console.error('Erro detalhado no Stripe:', err.message)
    return NextResponse.json(
      { error: `Erro no Stripe: ${err.message}` }, 
      { status: 500 }
    )
  }
}