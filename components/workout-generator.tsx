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
    <div className="flex items-center gap-2 text-[#FF8C00] font-semibold text-sm uppercase tracking-wider">
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={`
            px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ease-in-out border
            ${value === option 
              ? "bg-[#FF8C00] text-black border-[#FF8C00] shadow-[0_0_10px_rgba(255,140,0,0.4)]" 
              : "bg-[#121212] text-zinc-400 border-[#1F1F1F] hover:border-[#FF8C00]/50 hover:text-white"
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
)

export function WorkoutGenerator({ onGenerate, isLoading }: WorkoutGeneratorProps) {
  const [level, setLevel] = useState("Intermediário")
  const [duration, setDuration] = useState("45 min")
  const [focus, setFocus] = useState("Ganhar Massa")
  const [location, setLocation] = useState("Academia")
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
    <div className="w-full max-w-4xl mx-auto space-y-8 p-1">
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Coluna 1 */}
          <div className="space-y-6">
            <SelectionGroup 
              label="Nível de Experiência" 
              icon={Dumbbell}
              options={["Iniciante", "Intermediário", "Avançado"]}
              value={level}
              onChange={setLevel}
            />
            
            <SelectionGroup 
              label="Duração do Treino" 
              icon={Clock}
              options={["30 min", "45 min", "60+ min"]}
              value={duration}
              onChange={setDuration}
            />
          </div>

          {/* Coluna 2 */}
          <div className="space-y-6">
            <SelectionGroup 
              label="Foco Principal" 
              icon={Target}
              options={["Emagrecer", "Ganhar Massa", "Full Body", "Cardio"]}
              value={focus}
              onChange={setFocus}
            />

            <SelectionGroup 
              label="Onde vai treinar?" 
              icon={MapPin}
              options={["Academia", "Casa (Halteres)", "Casa (Sem Equipamento)"]}
              value={location}
              onChange={setLocation}
            />
          </div>
        </div>

        {/* Campo de Observações */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[#FF8C00] font-semibold text-sm uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Observações Adicionais</span>
          </div>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Ex: Tenho dor no joelho, quero focar em glúteos, tenho apenas elásticos..."
            className="w-full min-h-[100px] p-4 rounded-xl bg-[#121212] border border-[#1F1F1F] text-zinc-300 placeholder:text-zinc-600 focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] outline-none transition-all resize-none text-sm"
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
                ? "bg-[#1F1F1F] text-zinc-500 cursor-not-allowed border border-[#333]" 
                : "bg-gradient-to-r from-[#FF8C00] to-[#FF4500] hover:shadow-orange-500/40 text-white shadow-[0_0_20px_rgba(255,140,0,0.3)]"
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[#FF8C00]" />
                <span className="animate-pulse">Criando seu treino...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-5 h-5" />
                Gerar Treino com IA
              </div>
            )}
          </Button>
          
          {/* Barra de Progresso Decorativa (só aparece carregando) */}
          {isLoading && (
            <div className="w-full h-1 bg-[#121212] mt-4 rounded-full overflow-hidden">
              <div className="h-full bg-[#FF8C00] animate-progress-indeterminate" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}