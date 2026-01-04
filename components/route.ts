import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Inicializa o Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20", // Use a versão mais recente disponível no seu painel
});

// Inicializa o Supabase com permissões de Admin (Service Role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Eventos que queremos escutar
const relevantEvents = new Set([
  "checkout.session.completed",
  "invoice.payment_succeeded",
]);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!signature || !webhookSecret) {
      return new NextResponse("Webhook secret or signature missing", { status: 400 });
    }
    // Verifica se a requisição veio realmente do Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.log(`❌ Erro no Webhook: ${err.message}`);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case "checkout.session.completed":
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSession(session);
          break;
        case "invoice.payment_succeeded":
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePayment(invoice);
          break;
        default:
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      return new NextResponse('Webhook handler failed', { status: 500 });
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

// Função para lidar com nova assinatura/compra
async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  if (!session.customer_email) return;

  // Tenta pegar o nome do plano dos metadados (configure isso no produto do Stripe)
  // Ou define um padrão caso não venha
  const planName = session.metadata?.planName || "Premium"; 

  console.log(`Processando compra para: ${session.customer_email} - Plano: ${planName}`);

  // 1. Atualiza ou Cria o Usuário com o novo plano
  const { error: userError } = await supabase
    .from('users')
    .upsert({ 
        email: session.customer_email,
        name: session.customer_details?.name || "Novo Usuário",
        plan: planName,
        status: 'Ativo',
        amount: (session.amount_total || 0) / 100, // Converte centavos para reais
        updated_at: new Date().toISOString()
    }, { onConflict: 'email' });

  if (userError) console.error('Erro ao atualizar usuário:', userError);

  // 2. Registra o pagamento na tabela payments (para o gráfico financeiro)
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
        amount: (session.amount_total || 0) / 100,
        status: 'succeeded',
        customer_name: session.customer_details?.name || session.customer_email,
        customer_email: session.customer_email,
        stripe_payment_id: session.payment_intent,
        created_at: new Date().toISOString()
    });

  if (paymentError) console.error('Erro ao registrar pagamento:', paymentError);
}

// Função para lidar com renovações de assinatura (pagamentos recorrentes)
async function handleInvoicePayment(invoice: Stripe.Invoice) {
  if (!invoice.customer_email) return;

  // Apenas registra o pagamento para manter o histórico financeiro atualizado
  const { error } = await supabase
    .from('payments')
    .insert({
        amount: (invoice.amount_paid || 0) / 100,
        status: 'succeeded',
        customer_name: invoice.customer_name || invoice.customer_email,
        customer_email: invoice.customer_email,
        stripe_payment_id: invoice.payment_intent,
        created_at: new Date().toISOString()
    });
    
  if (error) console.error('Erro ao registrar fatura:', error);
}