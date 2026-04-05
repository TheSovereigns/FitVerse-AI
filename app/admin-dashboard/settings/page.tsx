"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { motion } from "framer-motion"
import { Settings, Bell, Shield, Palette, Globe, Key } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function AdminSettingsPage() {
  const { t, locale, setLocale } = useTranslation()
  const [activeTab, setActiveTab] = useState("general")

  const tabs = [
    { id: "general", icon: Settings, label: locale === "en-US" ? "General" : "Geral" },
    { id: "notifications", icon: Bell, label: locale === "en-US" ? "Notifications" : "Notificações" },
    { id: "security", icon: Shield, label: locale === "en-US" ? "Security" : "Segurança" },
    { id: "appearance", icon: Palette, label: locale === "en-US" ? "Appearance" : "Aparência" },
    { id: "api", icon: Key, label: "API Keys" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white">
          {locale === "en-US" ? "Settings" : "Configurações"}
        </h1>
        <p className="text-white/40 mt-1">
          {locale === "en-US" ? "Manage your admin dashboard settings" : "Gerenciar configurações do painel admin"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-strong border border-white/10 rounded-2xl p-4 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  activeTab === tab.id
                    ? "bg-primary/20 text-primary"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong border border-white/10 rounded-2xl p-6"
          >
            {activeTab === "general" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-white">
                  {locale === "en-US" ? "General Settings" : "Configurações Gerais"}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80 text-sm mb-2 block">
                      {locale === "en-US" ? "Default Language" : "Idioma Padrão"}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant={locale === "pt-BR" ? "default" : "outline"}
                        onClick={() => setLocale("pt-BR")}
                        className={locale === "pt-BR" ? "bg-primary text-white" : "bg-white/5 text-white/60 border-white/10"}
                      >
                        🇧🇷 Português
                      </Button>
                      <Button
                        variant={locale === "en-US" ? "default" : "outline"}
                        onClick={() => setLocale("en-US")}
                        className={locale === "en-US" ? "bg-primary text-white" : "bg-white/5 text-white/60 border-white/10"}
                      >
                        🇺🇸 English
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/80 text-sm mb-2 block">
                      {locale === "en-US" ? "Timezone" : "Fuso Horário"}
                    </Label>
                    <select className="w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl text-white">
                      <option value="America/Sao_Paulo">America/São Paulo (GMT-3)</option>
                      <option value="America/New_York">America/New York (GMT-5)</option>
                      <option value="Europe/London">Europe/London (GMT+0)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-white">
                  {locale === "en-US" ? "Notification Preferences" : "Preferências de Notificação"}
                </h3>
                
                <div className="space-y-4">
                  {[
                    { label: locale === "en-US" ? "New user registrations" : "Novos cadastros", desc: "Get notified when new users sign up" },
                    { label: locale === "en-US" ? "Subscription events" : "Eventos de assinatura", desc: "Get notified about new/canceled subscriptions" },
                    { label: locale === "en-US" ? "AI usage alerts" : "Alertas de uso da IA", desc: "Alert when AI usage exceeds threshold" },
                    { label: locale === "en-US" ? "Weekly reports" : "Relatórios semanais", desc: "Receive weekly analytics summary" },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{item.label}</p>
                        <p className="text-xs text-white/40">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-5 h-5 rounded bg-white/10 border-white/20 text-primary focus:ring-primary/20" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-white">
                  {locale === "en-US" ? "Security Settings" : "Configurações de Segurança"}
                </h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm font-medium text-white mb-2">Two-Factor Authentication</p>
                    <p className="text-xs text-white/40 mb-3">Add an extra layer of security to your account</p>
                    <Button variant="outline" className="bg-white/5 text-white border-white/10 hover:bg-white/10">
                      {locale === "en-US" ? "Enable 2FA" : "Ativar 2FA"}
                    </Button>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5">
                    <p className="text-sm font-medium text-white mb-2">Session Management</p>
                    <p className="text-xs text-white/40 mb-3">Manage active sessions and devices</p>
                    <Button variant="outline" className="bg-white/5 text-white border-white/10 hover:bg-white/10">
                      {locale === "en-US" ? "View Sessions" : "Ver Sessões"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "api" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-white">API Keys</h3>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">SupabaseAnon Key</p>
                      <span className="text-xs text-emerald-400">Active</span>
                    </div>
                    <code className="text-xs text-white/40 bg-black/30 px-2 py-1 rounded block truncate">
                      •••••••••••••••••••••••••••••••••
                    </code>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-white">Stripe API Key</p>
                      <span className="text-xs text-emerald-400">Active</span>
                    </div>
                    <code className="text-xs text-white/40 bg-black/30 px-2 py-1 rounded block truncate">
                      •••••••••••••••••••••••••••••••••
                    </code>
                  </div>
                  
                  <Button className="bg-primary text-white hover:bg-primary/90">
                    {locale === "en-US" ? "Generate New Key" : "Gerar Nova Chave"}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="space-y-6">
                <h3 className="text-lg font-black text-white">
                  {locale === "en-US" ? "Appearance" : "Aparência"}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-primary/20 border border-primary/30 text-center cursor-pointer">
                    <p className="text-sm font-medium text-primary">Dark (Orange)</p>
                    <p className="text-xs text-white/40 mt-1">Current</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center cursor-pointer opacity-50">
                    <p className="text-sm font-medium text-white">Light</p>
                    <p className="text-xs text-white/40 mt-1">{locale === "en-US" ? "Coming soon" : "Em breve"}</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}