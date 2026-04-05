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
  Sparkles,
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
    <div className="min-h-screen bg-gradient-to-br from-[#0d0705] via-[#1a0f00] to-[#0d0705]">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0d0705]/95 backdrop-blur-xl border-b border-white/5 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
        
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <span className="text-lg font-black text-white">FitVerse</span>
        </Link>

        <button
          onClick={signOut}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5 text-white/60" />
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
              className="md:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-[#0d0705]/95 backdrop-blur-xl border-r border-white/5 flex flex-col z-50"
            >
              {/* Logo */}
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-white">FitVerse</span>
                    <span className="text-xs text-primary ml-1">AI</span>
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <X className="w-5 h-5 text-white/60" />
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
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-primary/20 text-primary border border-primary/20"
                          : "text-white/60 hover:text-white hover:bg-white/5"
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
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">
                    {user?.email?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.email?.split("@")[0] || "Admin"}
                    </p>
                    <span className="text-xs text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
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
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-white/5 bg-[#0d0705]/80 backdrop-blur-xl flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-lg font-black text-white">FitVerse</span>
              <span className="text-xs text-primary ml-1">AI</span>
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
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
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split("@")[0] || "Admin"}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">
                  ADMIN
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {locale === "en-US" ? "Sign Out" : "Sair"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 pt-16 md:pt-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{locale === "en-US" ? "Back to App" : "Voltar ao App"}</span>
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-sm text-neutral-500">
              {getPageTitle()}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">AO VIVO</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-sm">
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