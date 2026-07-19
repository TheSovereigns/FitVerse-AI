import Stripe from "stripe"

const stripeKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeKey
  ? new Stripe(stripeKey, { typescript: true })
  : null

export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      "Stripe não configurado. Defina STRIPE_SECRET_KEY no .env"
    )
  }
  return stripe
}