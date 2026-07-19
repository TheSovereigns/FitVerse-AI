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
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-background/95 backdrop-blur-xl border-b border-border z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>
        
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-brand" />
          </div>
          <span className="text-lg font-black text-foreground">FitVerse</span>
        </Link>

        <button
          onClick={signOut}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
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
              className="md:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-background/95 backdrop-blur-xl border-r border-border flex flex-col z-50"
            >
              {/* Logo */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-foreground">FitVerse</span>
                    <span className="text-xs text-brand ml-1">AI</span>
                  </div>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg"
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
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        isActive
                          ? "bg-brand/10 text-brand border border-brand/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black">
                    {user?.email?.charAt(0).toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.email?.split("@")[0] || "Admin"}
                    </p>
                    <span className="text-xs text-brand bg-brand-muted px-1.5 py-0.5 rounded">
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
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 border-r border-border bg-card/80 backdrop-blur-xl flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand" />
            </div>
            <div>
              <span className="text-lg font-black text-foreground">FitVerse</span>
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-brand/10 text-brand border border-brand/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-black">
              {user?.email?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.email?.split("@")[0] || "Admin"}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-xs text-brand bg-brand-muted px-1.5 py-0.5 rounded">
                  ADMIN
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">{locale === "en-US" ? "Back to App" : "Voltar ao App"}</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm text-muted-foreground">
              {getPageTitle()}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 border border-success/20 rounded-full">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success font-medium">AO VIVO</span>
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