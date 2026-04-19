import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
})

export async function GET() {
  try {
    // Busca o faturamento total (balanço disponível + a caminho)
    const balance = await stripe.balance.retrieve()
    const total = balance.available.reduce((acc, b) => acc + b.amount, 0) + 
                  balance.pending.reduce((acc, b) => acc + b.amount, 0)

    return NextResponse.json({ 
      success: true, 
      totalAmount: total / 100 // Converte centavos para Real
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}