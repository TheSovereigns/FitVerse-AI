import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const hasSupabaseConfig = Boolean(
  supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseServiceKey.includes('placeholder') &&
    !supabaseServiceKey.includes('your_')
);
const supabaseAdmin = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
};

function isConfiguredStripeValue(value?: string): value is string {
  return Boolean(
    value &&
      !value.includes('placeholder') &&
      !value.includes('your_') &&
      value !== 'price_pro_monthly' &&
      value !== 'price_premium_monthly'
  );
}

const responseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: responseHeaders });
}

export async function POST(req: Request) {
  if (!isConfiguredStripeValue(process.env.STRIPE_SECRET_KEY)) {
    return NextResponse.json(
      { error: 'Stripe nao configurado. Configure STRIPE_SECRET_KEY no ambiente.' },
      { status: 500, headers: responseHeaders }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin nao configurado. Configure SUPABASE_SERVICE_ROLE_KEY no ambiente.' },
      { status: 500, headers: responseHeaders }
    );
  }

  try {
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Nao autorizado.' },
        { status: 401, headers: responseHeaders }
      );
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Token invalido.' },
        { status: 401, headers: responseHeaders }
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedPlan = typeof body.plan === 'string'
      ? body.plan.toLowerCase()
      : Object.entries(PRICE_IDS).find(([, priceId]) => priceId && priceId === body.priceId)?.[0];
    const plan = requestedPlan as keyof typeof PRICE_IDS | undefined;

    if (!plan || !['pro', 'premium'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plano invalido. Envie plan como pro ou premium.' },
        { status: 400, headers: responseHeaders }
      );
    }

    const priceId = PRICE_IDS[plan];
    if (!isConfiguredStripeValue(priceId)) {
      return NextResponse.json(
        { error: `Preco do plano ${plan} nao configurado. Configure ${plan === 'pro' ? 'STRIPE_PRO_PRICE_ID' : 'STRIPE_PREMIUM_PRICE_ID'} no ambiente.` },
        { status: 500, headers: responseHeaders }
      );
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id as string | undefined;
    const email = user.email || undefined;

    if (!customerId && email) {
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });

      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
      }

      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
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
      metadata: {
        userId: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan,
        },
      },
    };

    if (customerId) {
      sessionParams.customer = customerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ sessionId: session.id, url: session.url }, { headers: responseHeaders });
  } catch (error) {
    console.error('Erro no checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao criar sessao de pagamento.' },
      { status: 500, headers: responseHeaders }
    );
  }
}
