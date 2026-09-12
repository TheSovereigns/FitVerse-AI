"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Bot, 
  Settings,
  LogOut,
  ChevronRight,
  ArrowLeft,
  Menu,
  X,
  Database
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useTranslation } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type AdminNavKey = "admin_overview" | "admin_users" | "admin_revenue" | "admin_ai_usage" | "admin_dataset" | "admin_settings"

const navItems: { href: string; icon: any; labelKey: AdminNavKey }[] = [
  { href: "/admin-dashboard", icon: LayoutDashboard, labelKey: "admin_overview" },
  { href: "/admin-dashboard/users", icon: Users, labelKey: "admin_users" },
  { href: "/admin-dashboard/revenue", icon: CreditCard, labelKey: "admin_revenue" },
  { href: "/admin-dashboard/ai-usage", icon: Bot, labelKey: "admin_ai_usage" },
  { href: "/admin-dashboard/dataset", icon: Database, labelKey: "admin_dataset" },
  { href: "/admin-dashboard/settings", icon: Settings, labelKey: "admin_settings" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { signOut, user } = useAuth()
  const { t, locale } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const getPageTitle = () => {
    if (pathname === "/admin-dashboard") {
      return locale === "en-US" ? "Dashboard" : "Painel"
    }
    const item = navItems.find(n => pathname.startsWith(n.href))
    return item ? item.labelKey.replace("admin_", "") : ""
  }

  return (
    <div className="product-experience admin-experience relative min-h-screen overflow-x-hidden bg-[#070A08] text-[#F5F7F4]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_8%,rgba(110,255,141,0.12),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:auto,30px_30px]" />
      {/* Mobile Header */}
      <header className="fixed left-0 right-0 top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.10] bg-[#070A08]/94 px-4 backdrop-blur-2xl md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-brand/25 bg-brand/10 shadow-[0_0_22px_rgba(52,211,153,0.12)]">
            <img src="/icon.svg" alt="VyseFit" className="w-5 h-5" />
          </div>
          <span className="text-lg font-semibold tracking-[-0.05em] text-foreground">VyseFit</span>
        </Link>

        <button
          onClick={signOut}
          className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/[0.10] bg-[#0B100D]/98 shadow-[24px_0_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:hidden"
            >
              {/* Logo */}
              <div className="flex items-center justify-between border-b border-white/[0.10] p-4">
                <Link href="/" className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-brand/25 bg-brand/10 shadow-[0_0_22px_rgba(52,211,153,0.12)]">
                    <img src="/icon.svg" alt="VyseFit" className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold tracking-[-0.05em] text-foreground">VyseFit</span>
                    <span className="text-xs text-brand ml-1">AI</span>
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-lg p-2 text-white/65 hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                        isActive
                          ? "border border-brand/25 bg-brand/10 text-brand shadow-[0_0_22px_rgba(52,211,153,0.08)]"
                          : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {t(item.labelKey)}
                      </span>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* User Info */}
              <div className="border-t border-white/[0.10] p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black">
                    {user?.email?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.email?.split("@")[0] || "Admin"}
                    </p>
                    <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-xs text-brand">
                      ADMIN
                    </span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-white/[0.10] bg-[#0B100D]/94 shadow-[18px_0_70px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:flex">
        {/* Logo */}
        <div className="border-b border-white/[0.10] p-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-brand/25 bg-brand/10 shadow-[0_0_22px_rgba(52,211,153,0.12)]">
              <img src="/icon.svg" alt="VyseFit" className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-semibold tracking-[-0.05em] text-foreground">VyseFit</span>
              <span className="text-xs text-brand ml-1">AI</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
                  isActive
                    ? "border border-brand/25 bg-brand/10 text-brand shadow-[0_0_22px_rgba(52,211,153,0.08)]"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {t(item.labelKey)}
                </span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        <div className="border-t border-white/[0.10] p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email?.split("@")[0] || "Admin"}
              </p>
              <div className="flex items-center gap-1">
                <span className="rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-xs text-brand">
                  ADMIN
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <LogOut className="w-4 h-4" />
            {locale === "en-US" ? "Sign Out" : "Sair"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-10 p-4 pt-16 md:ml-64 md:p-8 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{locale === "en-US" ? "Back to App" : "Voltar ao App"}</span>
            </Link>
            <div className="h-4 w-px bg-white/[0.12]" />
            <span className="text-sm text-white/55">
              {getPageTitle()}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              <span className="text-xs font-medium text-brand">AO VIVO</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  )
}
