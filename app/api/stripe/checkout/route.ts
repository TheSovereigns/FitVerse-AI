import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// 1. Inicialize o Stripe com sua chave secreta
// Certifique-se de definir STRIPE_SECRET_KEY em seu arquivo .env.local
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: Request) {
  try {
    const { priceId } = await request.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Price ID is required' }, { status: 400 });
    }

    // 2. Crie uma Sessão de Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${request.headers.get('origin')}/?session_id={CHECKOUT_SESSION_ID}`, // Redireciona para a home em caso de sucesso
      cancel_url: `${request.headers.get('origin')}/`, // Redireciona para a home em caso de cancelamento
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error('STRIPE_CHECKOUT_ERROR', err);
    return NextResponse.json({ error: 'Error creating checkout session', details: err.message }, { status: 500 });
  }
}