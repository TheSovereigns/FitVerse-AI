"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Bell, BellOff, Calendar, Clock, Utensils, Dumbbell, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type ReminderType = "water" | "meal" | "workout" | "scan"

interface Reminder {
  id?: string
  user_id: string
  type: ReminderType
  enabled: boolean
  time: string
  days: string[]
}

export function PushNotificationsManager() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
    loadReminders()
  }, [user])

  const loadReminders = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data } = await supabase
        .from("user_reminders")
        .select("*")
        .eq("user_id", user.id)
      
      if (data && data.length > 0) {
        setReminders(data)
      } else {
        const defaultReminders = [
          { user_id: user.id, type: "water", enabled: true, time: "09:00", days: ["mon","tue","wed","thu","fri"] },
          { user_id: user.id, type: "meal", enabled: true, time: "12:00", days: ["mon","tue","wed","thu","fri"] },
          { user_id: user.id, type: "workout", enabled: false, time: "18:00", days: ["mon","wed","fri"] },
          { user_id: user.id, type: "scan", enabled: false, time: "10:00", days: ["sat"] },
        ]
        const { data: inserted } = await supabase
          .from("user_reminders")
          .insert(defaultReminders)
          .select()
        if (inserted) setReminders(inserted)
      }
    } catch (e) {
      console.error("Error loading reminders:", e)
    } finally {
      setLoading(false)
    }
  }

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Este navegador não suporta notificações")
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === "granted") {
        new Notification("FitVerse AI", {
          body: "Notificações ativadas com sucesso!",
          icon: "/icon.png"
        })
        toast.success("Notificações ativadas!")
      } else {
        toast.error("Permissão de notificação negada")
      }
    } catch (e) {
      console.error("Error requesting permission:", e)
    }
  }

  const toggleReminder = async (id: string, enabled: boolean) => {
    try {
      await supabase
        .from("user_reminders")
        .update({ enabled })
        .eq("id", id)
      
      setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled } : r))
      toast.success(enabled ? "Lembrete ativado" : "Lembrete desativado")
    } catch (e) {
      toast.error("Erro ao atualizar lembrete")
    }
  }

  const updateTime = async (id: string, time: string) => {
    try {
      await supabase
        .from("user_reminders")
        .update({ time })
        .eq("id", id)
      
      setReminders(prev => prev.map(r => r.id === id ? { ...r, time } : r))
    } catch (e) {
      console.error("Error updating time:", e)
    }
  }

  const getReminderLabel = (type: ReminderType) => {
    switch (type) {
      case "water": return "Lembrete de água"
      case "meal": return "Lembrete de refeição"
      case "workout": return "Lembrete de treino"
      case "scan": return "Lembrete de scan"
    }
  }

  const getReminderIcon = (type: ReminderType) => {
    switch (type) {
      case "water": return "💧"
      case "meal": return "🍽️"
      case "workout": return "🏋️"
      case "scan": return "📷"
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Permission Status */}
      <Card className="p-4 glass-strong">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {permission === "granted" ? (
              <Bell className="w-5 h-5 text-emerald-500" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">Notificações Push</p>
              <p className="text-xs text-muted-foreground">
                {permission === "granted" ? "Ativadas" : permission === "denied" ? "Bloqueadas" : "Não solicitadas"}
              </p>
            </div>
          </div>
          {permission !== "granted" && (
            <Button size="sm" onClick={requestPermission}>
              Ativar
            </Button>
          )}
        </div>
      </Card>

      {/* Reminders List */}
      <div className="space-y-3">
        <h3 className="text-sm font-black uppercase tracking-wider opacity-50">Lembretes</h3>
        {reminders.map((reminder) => (
          <Card key={reminder.id} className="p-4 glass-strong">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getReminderIcon(reminder.type)}</span>
                <div>
                  <p className="font-medium">{getReminderLabel(reminder.type)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <Input
                      type="time"
                      value={reminder.time}
                      onChange={(e) => reminder.id && updateTime(reminder.id, e.target.value)}
                      className="h-7 w-24 text-xs"
                    />
                  </div>
                </div>
              </div>
              <Switch
                checked={reminder.enabled}
                onCheckedChange={(checked) => reminder.id && toggleReminder(reminder.id, checked)}
                disabled={permission !== "granted"}
              />
            </div>
          </Card>
        ))}
      </div>

      {permission !== "granted" && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-500">Ative as notificações</p>
            <p className="text-xs text-amber-500/60 mt-1">
              Para receber lembretes, permita as notificações push do navegador.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}