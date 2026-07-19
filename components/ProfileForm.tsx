"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { useTranslation } from "@/lib/i18n"
import { z } from "zod"

const profileSchema = z.object({
  age: z.string().optional().refine(
    (val) => !val || (Number(val) >= 10 && Number(val) <= 120),
    { message: "Age must be between 10 and 120" }
  ),
  weight: z.string().optional().refine(
    (val) => !val || (Number(val) >= 20 && Number(val) <= 300),
    { message: "Weight must be between 20 and 300 kg" }
  ),
  height: z.string().optional().refine(
    (val) => !val || (Number(val) >= 100 && Number(val) <= 250),
    { message: "Height must be between 100 and 250 cm" }
  ),
  gender: z.enum(["", "male", "female", "other"]).optional(),
  fitness_goal: z.enum(["", "lose_weight", "gain_muscle", "maintain", "improve_health"]).optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface ProfileFormProps {
  initialData: {
    age: number | null
    weight: number | null
    height: number | null
    gender: string | null
    fitness_goal: string | null
  }
  userId: string
  onSuccess: (data: ProfileFormData) => void
  onCancel: () => void
  variant?: "settings" | "profile"
}

export function ProfileForm({ initialData, userId, onSuccess, onCancel, variant = "settings" }: ProfileFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<ProfileFormData>({
    age: initialData.age?.toString() || "",
    weight: initialData.weight?.toString() || "",
    height: initialData.height?.toString() || "",
    gender: (initialData.gender || "") as ProfileFormData["gender"],
    fitness_goal: (initialData.fitness_goal || "") as ProfileFormData["fitness_goal"],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isSettings = variant === "settings"

  const handleSave = async () => {
    const result = profileSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string
        fieldErrors[field] = issue.message
      })
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          age: parseInt(formData.age || "0") || null,
          weight: parseFloat(formData.weight || "0") || null,
          height: parseFloat(formData.height || "0") || null,
          gender: formData.gender || null,
          fitness_goal: formData.fitness_goal || null,
        })
        .eq("id", userId)

      if (!error) {
        onSuccess(formData)
        toast.success(t("settings_profile_saved") || "Perfil atualizado!")
      } else {
        toast.error("Erro ao salvar")
      }
    } catch {
      toast.error("Erro ao salvar")
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass = isSettings
    ? "h-12 rounded-xl border-border bg-background text-foreground"
    : "h-12 rounded-xl border-white/10 bg-white/5 text-foreground"

  const labelClass = isSettings
    ? "text-xs text-muted-foreground"
    : "text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50"

  const selectClass = isSettings
    ? "flex h-12 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"
    : "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/50"

  return (
    <div className={isSettings ? "p-4 md:p-6 space-y-4" : "grid grid-cols-2 gap-4 md:grid-cols-3"}>
      <div className="space-y-2">
        <label className={labelClass}>{t("sp_age")}</label>
        <Input
          type="number"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
          className={inputClass}
          min={10}
          max={120}
        />
        {errors.age && <p className="text-xs text-red-500">{errors.age}</p>}
      </div>
      <div className="space-y-2">
        <label className={labelClass}>{t("sp_weight_kg")}</label>
        <Input
          type="number"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          className={inputClass}
          min={20}
          max={300}
          step={0.1}
        />
        {errors.weight && <p className="text-xs text-red-500">{errors.weight}</p>}
      </div>
      <div className="space-y-2">
        <label className={labelClass}>{t("sp_height_cm")}</label>
        <Input
          type="number"
          value={formData.height}
          onChange={(e) => setFormData({ ...formData, height: e.target.value })}
          className={inputClass}
          min={100}
          max={250}
          step={0.1}
        />
        {errors.height && <p className="text-xs text-red-500">{errors.height}</p>}
      </div>
      <div className="space-y-2">
        <label className={labelClass}>{t("sp_gender")}</label>
        <select
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value as ProfileFormData["gender"] })}
          className={selectClass}
        >
          <option value="">{t("sp_select")}</option>
          <option value="male">{t("sp_male")}</option>
          <option value="female">{t("sp_female")}</option>
          <option value="other">{t("sp_other")}</option>
        </select>
      </div>
      <div className="space-y-2">
        <label className={labelClass}>{t("sp_goal")}</label>
        <select
          value={formData.fitness_goal}
          onChange={(e) => setFormData({ ...formData, fitness_goal: e.target.value as ProfileFormData["fitness_goal"] })}
          className={selectClass}
        >
          <option value="">{t("sp_select")}</option>
          <option value="lose_weight">{t("sp_lose_weight")}</option>
          <option value="gain_muscle">{t("sp_gain_muscle")}</option>
          <option value="maintain">{t("sp_maintain")}</option>
          <option value="improve_health">{t("sp_improve_health")}</option>
        </select>
      </div>
      {isSettings && (
        <div className="flex gap-3">
          <Button onClick={handleSave} disabled={isSaving} className="h-12 flex-1 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            {isSaving ? "..." : t("sp_save")}
          </Button>
          <Button onClick={onCancel} variant="ghost" className="h-12 rounded-2xl border border-border text-muted-foreground hover:bg-accent">
            {t("sp_cancel")}
          </Button>
        </div>
      )}
      {!isSettings && (
        <div className="flex items-end gap-2 col-span-2 md:col-span-3">
          <Button onClick={handleSave} disabled={isSaving} className="h-12 flex-1 rounded-xl bg-primary text-sm font-black text-white hover:bg-primary/80">
            <Check className="h-4 w-4 mr-2" />
            {isSaving ? "..." : t("hp_save")}
          </Button>
          <Button onClick={onCancel} variant="ghost" className="h-12 rounded-xl border border-white/10 bg-white/8 text-foreground/60 hover:bg-white/16">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
