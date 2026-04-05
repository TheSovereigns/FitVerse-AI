"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Dumbbell, Clock, Target, Zap, MapPin, FileText } from "lucide-react"

interface WorkoutGeneratorProps {
  onGenerate: (data: any) => void
  isLoading: boolean
}

// Componente auxiliar para os botões de seleção (Chips)
const SelectionGroup = ({ 
  label, 
  options, 
  value, 
  onChange, 
  icon: Icon 
}: { 
  label: string, 
  options: string[], 
  value: string, 
  onChange: (val: string) => void, 
  icon: any 
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`px-3 md:px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-300 ease-in-out border
            ${
              value === option
              ? "bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(255,140,0,0.4)]"
              : "bg-white dark:bg-card text-muted-foreground border-gray-200 dark:border-border hover:border-primary/50 hover:text-foreground"
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
)

import { useTranslation } from "@/lib/i18n"

export function WorkoutGenerator({ onGenerate, isLoading }: WorkoutGeneratorProps) {
  const { t } = useTranslation()
  const [level, setLevel] = useState(t("wg_intermediate"))
  const [duration, setDuration] = useState("45 min")
  const [focus, setFocus] = useState(t("wg_gain"))
  const [location, setLocation] = useState(t("wg_gym"))
  const [observations, setObservations] = useState("")

  const handleGenerateClick = () => {
    onGenerate({
      level,
      duration,
      focus,
      location,
      observations,
    })
  }

  return (
    <div className="w-full space-y-6 md:space-y-8">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Coluna 1 */}
          <div className="space-y-6">
            <SelectionGroup 
              label={t("wg_level")} 
              icon={Dumbbell}
              options={[t("wg_beginner"), t("wg_intermediate"), t("wg_advanced")]}
              value={level}
              onChange={setLevel}
            />
            
            <SelectionGroup 
              label={t("wg_duration")} 
              icon={Clock}
              options={["30 min", "45 min", "60+ min"]}
              value={duration}
              onChange={setDuration}
            />
          </div>

          {/* Coluna 2 */}
          <div className="space-y-6">
            <SelectionGroup 
              label={t("wg_focus")} 
              icon={Target}
              options={[t("wg_lose"), t("wg_gain"), t("wg_fullbody"), t("wg_cardio")]}
              value={focus}
              onChange={setFocus}
            />

            <SelectionGroup 
              label={t("wg_location")} 
              icon={MapPin}
              options={[t("wg_gym"), t("wg_home_dumbbells"), t("wg_home_body")]}
              value={location}
              onChange={setLocation}
            />
          </div>
        </div>
        {/* Campo de Observações */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary font-semibold text-sm uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>{t("wg_notes")}</span>
          </div>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder={t("wg_notes_placeholder")}
            className="w-full min-h-[100px] p-4 rounded-xl bg-white dark:bg-card border border-gray-200 dark:border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-sm"
          />
        </div>

        {/* Botão de Ação e Feedback Visual */}
        <div className="pt-4">
          <Button
            onClick={handleGenerateClick}
            disabled={isLoading}
            className={`
              w-full h-14 text-lg font-bold uppercase tracking-widest transition-all duration-300 ease-in-out
              ${isLoading
                ? "bg-gray-100 dark:bg-muted text-muted-foreground cursor-not-allowed border border-gray-200 dark:border-border"
                : "bg-gradient-to-r from-primary to-primary/80 hover:shadow-primary/40 text-primary-foreground shadow-[0_0_20px_rgba(255,140,0,0.3)]"
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="animate-pulse">{t("wg_generating")}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                {t("wg_generate")}
              </div>
            )}
          </Button>
          
          {/* Barra de Progresso Decorativa (só aparece carregando) */}
          {isLoading && (
            <div className="w-full h-1 bg-gray-100 dark:bg-muted mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-indeterminate" />
            </div>
          )}
        </div>
    </div>
  )
}