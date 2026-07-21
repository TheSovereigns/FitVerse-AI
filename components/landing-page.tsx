"use client"

import { motion } from "framer-motion"
import { 
  ScanLine, Dumbbell, UtensilsCrossed, MessageCircle, 
  Heart, Brain, ArrowRight, Check, Sparkles, Menu, X
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const features = [
  { icon: ScanLine, title: "AI Food Scan", desc: "Scan any food product for instant nutrition analysis, health scores, and alternatives." },
  { icon: Dumbbell, title: "Smart Workouts", desc: "AI-generated periodized training plans based on your goals and equipment." },
  { icon: UtensilsCrossed, title: "Meal Plans", desc: "Personalized weekly meal plans with shopping lists and macro tracking." },
  { icon: MessageCircle, title: "AI Coach", desc: "24/7 nutrition and fitness chatbot that knows your profile." },
  { icon: Heart, title: "Health Tracking", desc: "Sleep, stress, mood, fasting, and biological age analysis." },
  { icon: Brain, title: "Biohacking", desc: "Supplement recommendations, longevity scoring, and optimization tips." },
]

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with essential features",
    features: ["5 food scans/day", "1 workout/month", "Basic chatbot", "Longevity score", "Habit builder"],
    cta: "Start Free",
    href: "/auth/signup",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19.90",
    period: "/month",
    description: "For serious fitness enthusiasts",
    features: ["Unlimited scans", "Unlimited workouts", "AI Coach", "Meal planner", "Sleep & stress tracking", "Body tracker", "Workout timer"],
    cta: "Get Pro",
    href: "/auth/signup",
    popular: true,
  },
  {
    name: "Premium",
    price: "$29.90",
    period: "/month",
    description: "Complete biohacking experience",
    features: ["Everything in Pro", "Biological age analysis", "Metabolic plan", "Guided meditation", "Predictive analytics", "Weekly reports", "Reward shop", "Priority support"],
    cta: "Go Premium",
    href: "/auth/signup",
    popular: false,
  },
]

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-brand-foreground" />
            </div>
            <span className="text-lg font-black tracking-tight">FitVerse AI</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <Link href="/auth/signup" className="text-sm font-medium bg-brand text-brand-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
              Sign Up
            </Link>
          </div>

          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background p-4 space-y-3">
            <Link href="#features" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            <Link href="#pricing" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
            <Link href="/auth/login" className="block text-sm font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link href="/auth/signup" className="block text-sm font-medium bg-brand text-brand-foreground px-4 py-2 rounded-xl text-center" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
          </div>
        )}
      </nav>

      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-brand-muted text-brand px-4 py-2 rounded-full text-sm font-bold mb-8 border border-brand/20">
              <Sparkles className="w-4 h-4" />
              AI-Powered Fitness & Nutrition
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-none mb-6">
              Your Body.<br /><span className="text-gradient">Optimized.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Scan food, generate workouts, plan meals, and track your health — all powered by advanced AI. Your personal biohacking coach in your pocket.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="flex items-center gap-2 bg-brand text-brand-foreground px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity shadow-lg shadow-brand/20">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="#features" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-8 py-4 rounded-2xl text-lg font-bold border border-border glass-subtle">
                See Features
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground">One app to replace your gym notebook, diet plan, and health tracker.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6 hover:border-brand/30 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-brand-muted flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-xl font-black mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground">Start free, upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`bg-card border rounded-2xl p-8 relative ${plan.popular ? 'border-brand shadow-lg shadow-brand/10' : 'border-border'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black">{plan.price}</span>
                  {plan.period !== "forever" && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <h3 className="text-xl font-black mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-brand shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center py-3 rounded-xl font-bold transition-opacity ${plan.popular ? 'bg-brand text-brand-foreground hover:opacity-90' : 'border border-border hover:bg-muted/50'}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="gradient-brand rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
            <h2 className="text-4xl font-black tracking-tight mb-4 text-white relative">Ready to Transform?</h2>
            <p className="text-xl text-white/80 mb-8 relative">Join thousands optimizing their health with AI.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity relative shadow-lg">
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
              <ScanLine className="w-5 h-5 text-brand-foreground" />
            </div>
            <span className="font-black">FitVerse AI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 FitVerse AI. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/auth/signup" className="hover:text-brand transition-colors font-medium">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
