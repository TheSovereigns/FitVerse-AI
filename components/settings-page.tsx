"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Switch } from "./switch"
import { ArrowLeft, Moon, Sun, Bell, Trash2, LogOut, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

// Componente auxiliar para padronizar as linhas de configuração
const SettingRow = ({ icon: Icon, title, description, children }: { icon: React.ElementType, title: string, description: string, children: React.ReactNode }) => (
  <div className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border">
    <div className="flex items-center gap-4">
      <Icon className="w-5 h-5 text-muted-foreground" />
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <div>
      {children}
    </div>
  </div>
);

export function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [userSubscription, setUserSubscription] = useState("free")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [adsEnabled, setAdsEnabled] = useState(true)

  useEffect(() => {
    // Simula a busca do status de assinatura do usuário
    const user = JSON.parse(localStorage.getItem("user") || '{"subscription":"free"}')
    const subscription = user.subscription || "free"
    setUserSubscription(subscription)

    // Anúncios são desativados por padrão para usuários Pro/Premium
    if (subscription !== "free") {
      const storedAds = localStorage.getItem("adsEnabled")
      setAdsEnabled(storedAds ? JSON.parse(storedAds) : false)
    } else {
      setAdsEnabled(true)
    }

    const storedNotifications = localStorage.getItem("notificationsEnabled")
    if (storedNotifications) {
      setNotificationsEnabled(JSON.parse(storedNotifications))
    }
  }, [])

  const handleAdsToggle = (checked: boolean) => {
    if (userSubscription === "free") {
      toast.error("Apenas para membros PRO ou Premium.", {
        description: "Faça upgrade para remover os anúncios.",
        action: {
          label: "Upgrade",
          onClick: () => router.push("/subscription"),
        },
      })
      return
    }
    setAdsEnabled(!checked) // A lógica é "desativar", então invertemos o 'checked'
    localStorage.setItem("adsEnabled", JSON.stringify(!checked))
    toast.success(`Anúncios ${!checked ? 'ativados' : 'desativados'}.`)
  }

  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked)
    localStorage.setItem("notificationsEnabled", JSON.stringify(checked))
    toast.success(`Notificações ${checked ? 'ativadas' : 'desativadas'}.`)
  }

  const handleClearCache = () => {
    localStorage.removeItem("scanHistory")
    toast.success("Cache de scans limpo com sucesso!")
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("adsEnabled")
    // Opcional: limpar outros dados
    toast.success("Você saiu da conta.")
    router.push("/")
  }

  return (
    <div className="px-4 pt-8 pb-24 text-foreground bg-background min-h-screen">
      <div className="w-full max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center justify-center pt-8 pb-12 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                Configurações
            </h1>
            <p className="text-zinc-500 text-[9px] font-bold tracking-[0.4em] uppercase mt-2">
                AJUSTES DO SISTEMA
            </p>
        </div>

        {/* Card de Configurações */}
        <div className="relative bg-card/80 border border-border rounded-[2rem] p-6 overflow-hidden shadow-2xl space-y-4">
            {/* Cantoneiras */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-xl opacity-80" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-xl opacity-80" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-xl opacity-80" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-xl opacity-80" />

            {/* Seção de Conta */}
            <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest px-4 pt-2">Conta</h3>
            <SettingRow icon={ShieldCheck} title="Remover Anúncios" description="Navegue sem interrupções">
                <div className="flex items-center gap-3">
                    {userSubscription === 'free' && <span className="text-xs font-bold text-primary">PRO</span>}
                    <Switch
                        checked={!adsEnabled}
                        onCheckedChange={handleAdsToggle}
                        disabled={userSubscription === 'free'}
                        aria-label="Remover Anúncios"
                    />
                </div>
            </SettingRow>

            {/* Seção de Aparência */}
            <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest px-4 pt-4">Aparência</h3>
             <SettingRow icon={theme === 'dark' ? Moon : Sun} title="Tema do Aplicativo" description={`Atualmente em modo ${theme === 'dark' ? 'Escuro' : 'Claro'}`}>
                <Button variant="outline" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    Mudar para {theme === 'dark' ? 'Claro' : 'Escuro'}
                </Button>
            </SettingRow>

            {/* Seção de Notificações */}
            <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest px-4 pt-4">Notificações</h3>
            <SettingRow icon={Bell} title="Alertas de Performance" description="Receba dicas e lembretes">
                <Switch
                    checked={notificationsEnabled}
                    onCheckedChange={handleNotificationsToggle}
                    aria-label="Alertas de Performance"
                />
            </SettingRow>

            {/* Seção de Dados */}
            <h3 className="font-bold text-muted-foreground text-xs uppercase tracking-widest px-4 pt-4">Dados</h3>
            <SettingRow icon={Trash2} title="Limpar Cache Local" description="Libera o histórico de scans salvos">
                <Button variant="destructive" size="sm" onClick={handleClearCache}>
                    Limpar
                </Button>
            </SettingRow>

            {/* Seção de Logout */}
             <div className="pt-6">
                <Button variant="outline" onClick={handleLogout} className="w-full h-12">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair da Conta
                </Button>
            </div>
        </div>
      </div>
    </div>
  )
}