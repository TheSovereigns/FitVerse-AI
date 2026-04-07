import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-04-30.basil',
});

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  premium: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
};

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

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe não configurado. Configure STRIPE_SECRET_KEY no ambiente.' },
      { status: 500, headers }
    );
  }

  try {
    const body = await req.json();
    const { plan, userId, email } = body;

    if (!plan || !userId) {
      return NextResponse.json(
        { error: 'Plano e ID do usuário são obrigatórios.' },
        { status: 400, headers }
      );
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    if (!priceId) {
      return NextResponse.json(
        { error: 'Plano inválido.' },
        { status: 400, headers }
      );
    }

    let customerId: string | undefined;

    if (email) {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId },
        });
        customerId = customer.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/subscription?canceled=true`,
      customer: customerId,
      metadata: {
        userId,
        plan,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url }, { headers });
  } catch (error) {
    console.error('Erro no checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sessão de pagamento.' },
      { status: 500, headers }
    );
  }
}