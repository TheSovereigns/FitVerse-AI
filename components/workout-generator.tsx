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
  const { t, locale } = useTranslation()
  const [level, setLevel] = useState(t("wg_intermediate"))
  const [duration, setDuration] = useState(t("wg_default_duration"))
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
              options={[t("wg_duration_30"), t("wg_duration_45"), t("wg_duration_60")]}
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
          {/* Container com animação de fundo durante loading */}
          <div className={`relative ${isLoading ? 'animate-pulse' : ''}`}>
            {/* Overlay brilhante durante loading */}
            {isLoading && (
              <div className="absolute -inset-2 bg-primary/20 rounded-[2rem] blur-xl animate-pulse" />
            )}
            
            <Button
              onClick={handleGenerateClick}
              disabled={isLoading}
              className={`
                w-full h-14 text-lg font-bold uppercase tracking-widest transition-all duration-300 ease-in-out relative overflow-hidden group
                ${isLoading
                  ? "bg-primary/80 text-white border-2 border-primary/50"
                  : "bg-gradient-to-r from-primary to-orange-600 hover:shadow-[0_0_30px_rgba(255,140,0,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                }
              `}
            >
              {/* Efeito shimmer e brilho durante loading */}
              {isLoading && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  <div className="absolute inset-0 bg-primary/50 animate-pulse" />
                </>
              )}
              
              {/* Ripple effect ao hover */}
              {!isLoading && (
                <div className="absolute inset-0 rounded-[2rem] overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </div>
              )}
              
              {isLoading ? (
                <div className="flex items-center justify-center gap-3 relative z-10">
                  {/* Loader duplo com efeko de pulsar */}
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 w-8 h-8 bg-white/30 rounded-full animate-ping" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-white font-black tracking-wider">{t("wg_generating")}</span>
                    <span className="text-[10px] text-white/60 font-bold">⚡ AI Working...</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 relative z-10">
                  <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" />
                  {t("wg_generate")}
                </div>
              )}
            </Button>
          </div>
          
          {/* Barra de progresso animada e pontos pulsantes */}
          {isLoading && (
            <div className="mt-4 space-y-3">
              {/* Barra de progresso */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-white rounded-full animate-progress-indeterminate" />
              </div>
              
              {/* Status com pontos e texto */}
              <div className="flex items-center justify-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-bold text-primary animate-pulse">{t("wg_generating")}...</span>
              </div>
              
              {/* Texto de detalhe */}
              <p className="text-center text-xs text-muted-foreground/60 font-medium">
                {locale === "en-US" ? "Creating your personalized workout..." : "Criando seu treino personalizado..."}
              </p>
            </div>
          )}
        </div>
    </div>
  )
}