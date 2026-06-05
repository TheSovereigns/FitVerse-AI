import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

type PaidPlan = 'pro' | 'premium';

function normalizePlan(plan: unknown): PaidPlan | null {
  return plan === 'pro' || plan === 'premium' ? plan : null;
}

function getPeriodDate(seconds?: number | null) {
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status) {
  if (status === 'active' || status === 'trialing' || status === 'past_due') {
    return status;
  }

  return 'canceled';
}

async function syncSubscription(subscription: Stripe.Subscription) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin is not configured');
  }

  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_start?: number | null;
    current_period_end?: number | null;
  };
  const userId = subscription.metadata?.userId;
  const plan = normalizePlan(subscription.metadata?.plan);

  if (!userId || !plan) {
    throw new Error('Missing userId or plan in Stripe subscription metadata');
  }

  const activeStatuses = ['active', 'trialing'];
  const profilePlan = activeStatuses.includes(subscription.status) ? plan : 'free';

  await supabaseAdmin
    .from('profiles')
    .update({
      plan: profilePlan,
      ads_enabled: profilePlan === 'free',
    })
    .eq('id', userId);

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      plan,
      status: normalizeSubscriptionStatus(subscription.status),
      current_period_start: getPeriodDate(subscriptionWithPeriod.current_period_start),
      current_period_end: getPeriodDate(subscriptionWithPeriod.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'stripe_subscription_id',
    });
}

export async function POST(req: Request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Stripe webhook is not configured' },
      { status: 500 }
    );
  }

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase admin is not configured' },
      { status: 500 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid webhook payload';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription.toString()
        );
        await syncSubscription(subscription);
      }
    }

    if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }

    await supabaseAdmin
      .from('stripe_webhooks')
      .upsert({
        stripe_event_id: event.id,
        event_type: event.type,
        data: event as unknown as Record<string, unknown>,
        processed: true,
      }, {
        onConflict: 'stripe_event_id',
      });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
