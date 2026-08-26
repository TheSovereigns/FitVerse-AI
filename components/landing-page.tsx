"use client"

import { motion } from "framer-motion"
import { 
  ScanLine, Dumbbell, UtensilsCrossed, MessageCircle, 
  Heart, Brain, ArrowRight, Check, Sparkles, Menu, X, Shield,
  Zap, TrendingUp, Activity
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const features = [
  { icon: ScanLine, title: "AI Food Scan", desc: "Scan any food product for instant nutrition analysis, health scores, and alternatives." },
  { icon: Dumbbell, title: "Smart Workouts", desc: "AI-generated periodized training plans based on your goals and equipment." },
  { icon: UtensilsCrossed, title: "Meal Plans", desc: "Personalized weekly meal plans with shopping lists and macro tracking." },
  { icon: MessageCircle, title: "AI Coach", desc: "24/7 nutrition and fitness chatbot that knows your profile." },
  { icon: Heart, title: "Health Tracking", desc: "Sleep, stress, mood, fasting, and biological age analysis." },
  { icon: Brain, title: "Supplements", desc: "Supplement recommendations, longevity scoring, and optimization tips." },
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
    description: "Complete fitness experience",
    features: ["Everything in Pro", "Health age analysis", "Metabolic plan", "Guided meditation", "Predictive analytics", "Weekly reports", "Reward shop", "Priority support"],
    cta: "Go Premium",
    href: "/auth/signup",
    popular: false,
  },
]

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-emerald-600 flex items-center justify-center overflow-hidden shadow-lg shadow-brand/20">
              <img src="/icon.svg" alt="VyseFit" className="w-5 h-5" />
            </div>
            <span className="text-lg font-black tracking-tight">VyseFit AI</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/auth/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Login</Link>
            <Link href="/auth/signup" className="text-sm font-bold bg-brand text-brand-foreground px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-brand/20 text-cta text-xs">
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
            <Link href="/auth/signup" className="block text-sm font-bold bg-brand text-brand-foreground px-4 py-2.5 rounded-xl text-center" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand/8 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-brand-muted text-brand px-4 py-2 rounded-full text-sm font-bold mb-8 border border-brand/20 badge-shine">
              <Sparkles className="w-4 h-4" />
              AI-Powered Fitness & Nutrition
            </div>
            <h1 className="text-hero font-black tracking-tight leading-none mb-6">
              Your Body.<br /><span className="text-gradient">Optimized.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance">
              Scan food, generate workouts, plan meals, and track your health — all powered by advanced AI. Your personal fitness coach in your pocket.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/signup" className="flex items-center gap-2 bg-brand text-brand-foreground px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity shadow-lg shadow-brand/25 shine-effect">
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

      {/* Features — glass cards with hover glow */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground">One app to replace your gym notebook, diet plan, and health tracker.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group glass-strong border border-border rounded-2xl p-6 card-hover hover:border-brand/10 transition-all duration-300 hover:shadow-[0_0_40px_rgba(52,211,153,0.08)]">
                <div className="w-12 h-12 rounded-2xl bg-brand-muted flex items-center justify-center mb-4 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] transition-shadow">
                  <f.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Simple Pricing</h2>
            <p className="text-xl text-muted-foreground">Start free, upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`glass-strong border rounded-2xl p-8 relative ${plan.popular ? 'border-brand shadow-lg shadow-brand/15' : 'border-border'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider badge-shine">
                    Most Popular
                  </div>
                )}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl text-score">{plan.price}</span>
                  {plan.period !== "forever" && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <h3 className="text-xl mb-1 text-cta">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-brand shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} className={`block text-center py-3 rounded-xl font-bold transition-opacity ${plan.popular ? 'bg-brand text-brand-foreground hover:opacity-90 shadow-lg shadow-brand/20' : 'border border-border hover:bg-muted/50'}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="px-4">
        <div className="rounded-2xl glass-strong mx-auto max-w-4xl -mt-8 relative z-10 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 border border-border">
          {[
            { icon: ScanLine, value: "10K+", label: "Scans Daily" },
            { icon: Dumbbell, value: "50K+", label: "Workouts Generated" },
            { icon: Users, value: "25K+", label: "Active Users" },
            { icon: TrendingUp, value: "4.9", label: "App Rating" },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center">
              <stat.icon className="w-5 h-5 text-brand mx-auto mb-2" />
              <p className="text-3xl text-score">{stat.value}</p>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA — GTA 6 style grain + chrome */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="gradient-brand rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <h2 className="text-4xl font-black tracking-tight mb-4 text-white relative z-10">Ready to Transform?</h2>
            <p className="text-xl text-white/80 mb-8 relative z-10">Join thousands optimizing their health with AI.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-opacity relative z-10 shadow-lg shine-effect">
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer — expanded */}
      <footer className="border-t border-border py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand to-emerald-600 flex items-center justify-center overflow-hidden">
                  <img src="/icon.svg" alt="VyseFit" className="w-5 h-5" />
                </div>
                <span className="font-black">VyseFit AI</span>
              </div>
              <p className="text-sm text-muted-foreground">AI-powered nutrition & fitness intelligence for a healthier life.</p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/auth/signup" className="hover:text-brand transition-colors">Get Started</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Account</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/auth/login" className="hover:text-foreground transition-colors">Login</Link></li>
                <li><Link href="/auth/signup" className="hover:text-brand transition-colors font-medium">Sign Up</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">&copy; 2026 VyseFit AI. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> SOC 2 Compliant</span>
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> 99.9% Uptime</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}
