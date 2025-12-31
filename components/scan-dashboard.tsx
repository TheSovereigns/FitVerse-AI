"use client"

import React, { useRef } from 'react'
import { Camera, Zap, ShieldCheck, Trophy, ArrowRight } from 'lucide-react'

interface ScanDashboardProps {
  onScan: (file: File) => void;
}

export function ScanDashboard({ onScan }: ScanDashboardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleStartScan = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onScan(file)
    }
  }

  return (
    <div className="p-6 bg-[#080808] min-h-screen text-white font-sans">
      {/* Header FitVerse - Foco 2027/2028 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
            FIT<span className="text-[#FF8C00]">VERSE</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.2em] uppercase mt-2">
            AI Global Performance System
          </p>
        </div>
      </div>

      {/* Main Scan Area */}
      <div className="max-w-5xl mx-auto">
        <div className="bg-[#121212] border border-[#1F1F1F] rounded-[2.5rem] p-12 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl border-b-[6px] border-b-[#FF8C00]">
          
          {/* Glow de fundo laranja */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#FF8C00] opacity-[0.07] blur-[120px] pointer-events-none" />
          
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
          />

          <div className="relative mb-8">
            <div className="w-36 h-36 bg-gradient-to-br from-[#FF8C00] to-[#CC5500] rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,140,0,0.25)] transition-transform group-hover:scale-105 duration-500">
              <Camera size={56} className="text-black" />
            </div>
            {/* Corner Borders */}
            <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-[#FF8C00] rounded-tl-lg" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-[#FF8C00] rounded-br-lg" />
          </div>

          <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-center">
            BioScan <span className="text-[#FF8C00]">Intelligence</span>
          </h2>
          
          <p className="text-gray-400 text-center mb-10 max-w-md leading-relaxed font-medium">
            Análise instantânea de compostos químicos e bio-compatibilidade. 
            Validado para padrões de saúde USA/BR.
          </p>

          <button 
            onClick={handleStartScan}
            className="w-full max-w-md bg-[#FF8C00] hover:bg-[#FF9D29] hover:shadow-[0_0_30px_rgba(255,140,0,0.4)] transition-all text-black font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-2 group/btn"
          >
            <span>Iniciar Escaneamento</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </button>

          <div className="mt-10 flex items-center gap-4 bg-black/40 px-8 py-3 rounded-2xl border border-[#1F1F1F]">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 uppercase font-black">Daily Limit</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[#FF8C00] font-black text-2xl">5</span>
                <span className="text-gray-600 font-bold text-xs">/ UNLIMITED</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-[#1F1F1F] mx-2" />
            <button className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00] hover:underline">
              Upgrade to Pro
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {[
            { icon: Zap, text: "Real-time AI Analysis" },
            { icon: ShieldCheck, text: "FDA & Anvisa Database" },
            { icon: Trophy, text: "Biohacking Optimized" }
          ].map((item, idx) => (
            <div key={idx} className="bg-[#121212]/50 border border-[#1F1F1F] p-5 rounded-2xl flex items-center gap-4">
              <item.icon size={20} className="text-[#FF8C00]" />
              <span className="text-[11px] font-black uppercase tracking-tighter text-gray-300">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}