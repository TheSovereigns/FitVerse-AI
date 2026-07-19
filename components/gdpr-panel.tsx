"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { notifications } from "@/lib/notifications"
import { exportAllDataJSON } from "@/lib/export-data"
import { useAuth } from "@/hooks/useAuth"
import { clearFitVerseStorage } from "@/lib/auth-helpers"
import { Download, Trash2, Shield, FileText } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function GDPRPanel() {
  const { user } = useAuth()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleExportData = () => {
    const data: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("fitverse-") || key?.startsWith("daily") || key?.startsWith("user")) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || "{}")
        } catch {
          data[key!] = localStorage.getItem(key)
        }
      }
    }
    exportAllDataJSON(data)
    notifications.success("Dados exportados com sucesso!")
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      clearFitVerseStorage()
      if (user) {
        await supabase.from("profiles").delete().eq("id", user.id)
        await supabase.auth.admin.deleteUser(user.id)
      }
      notifications.success("Conta excluída com sucesso")
      window.location.href = "/auth/login"
    } catch (error) {
      notifications.error("Erro ao excluir conta")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Privacidade e Dados (LGPD/GDPR)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Você tem direito acessar, exportar e excluir todos os seus dados pessoais.
          </p>

          <Button variant="outline" className="w-full justify-start rounded-xl" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Exportar Todos os Dados
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start rounded-xl text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir Minha Conta e Dados
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Termos e Política
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="#" className="block text-xs text-brand hover:underline">
            Termos de Uso
          </a>
          <a href="#" className="block text-xs text-brand hover:underline">
            Política de Privacidade
          </a>
          <a href="#" className="block text-xs text-brand hover:underline">
            Política de Cookies
          </a>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Excluir conta e dados"
        description="Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos."
        confirmText={isDeleting ? "Excluindo..." : "Sim, excluir tudo"}
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
