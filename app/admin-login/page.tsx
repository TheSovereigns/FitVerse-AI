"use client"

import React, { useEffect, useState } from 'react'
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts'
import { Users, Activity, DollarSign, Loader2, Star, Shield, User, TrendingUp, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    faturamentoTotal: 0,
    usuariosFree: 0,
    usuariosPro: 0,
    usuariosPremium: 0,
    historico: [
      { name: 'Seg', ganhos: 10 }, { name: 'Ter', ganhos: 25 },
      { name: 'Qua', ganhos: 15 }, { name: 'Qui', ganhos: 45 },
      { name: 'Sex', ganhos: 30 }, { name: 'Sáb', ganhos: 55 },
      { name: 'Dom', ganhos: 40 },
    ]
  })

  const totalUsuarios = stats.usuariosFree + stats.usuariosPro + stats.usuariosPremium
  const lucroPorSocio = stats.faturamentoTotal / 3

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="text-[#FF8C00] animate-spin" size={40} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans selection:bg-[#FF8C00] selection:text-black">
      
      {/* Botão Voltar e Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className="p-3 bg-[#0A0A0A] border border-[#1A1A1A] rounded-2xl text-gray-400 hover:text-[#FF8C00] hover:border-[#FF8C00]/50 transition-all group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">
              DASHBOARD <span className="text-[#FF8C00]">ADMIN</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2 italic">
              Gestão de Performance e Renda Real
            </p>
          </div>
        </div>
        
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 bg-[#FF8C00] rounded-full animate-pulse shadow-[0_0_10px_#FF8C00]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Database Live</span>
        </div>
      </div>

      {/* Grid de Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-[#0A0A0A] border-2 border-[#FF8C00] p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl shadow-orange-900/5">
          <h3 className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-widest italic">Renda Bruta (100% Sócios)</h3>
          <p className="text-4xl font-black italic text-white">R$ {stats.faturamentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 text-[#FF8C00] text-[10px] font-bold uppercase tracking-tighter">
             <TrendingUp size={14} /> 100% Repasse Sócios Fundadores
          </div>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-[2.5rem]">
          <h3 className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-widest italic">Comunidade FitVerse</h3>
          <p className="text-4xl font-black italic">{totalUsuarios} <span className="text-sm text-gray-700 not-italic uppercase tracking-widest">Membros</span></p>
          <p className="text-gray-600 text-[10px] font-bold uppercase mt-4 italic tracking-tighter">Base de Dados Supabase</p>
        </div>

        {/* Segmentação Detalhada */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-8 rounded-[2.5rem] flex flex-col justify-center gap-4">
          <div className="flex justify-between items-center group">
            <div className="flex items-center gap-2 text-gray-500 group-hover:text-white transition-colors">
              <User size={14}/> <span className="text-[10px] font-black uppercase">Free</span>
            </div>
            <span className="font-black italic text-xl">{stats.usuariosFree}</span>
          </div>
          <div className="flex justify-between items-center group">
            <div className="flex items-center gap-2 text-[#FF8C00]">
              <Shield size={14}/> <span className="text-[10px] font-black uppercase">Pro</span>
            </div>
            <span className="font-black italic text-xl">{stats.usuariosPro}</span>
          </div>
          <div className="flex justify-between items-center group">
            <div className="flex items-center gap-2 text-orange-400">
              <Star size={14}/> <span className="text-[10px] font-black uppercase">Premium</span>
            </div>
            <span className="font-black italic text-xl">{stats.usuariosPremium}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Ganhos */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-10 rounded-[3rem] h-[450px]">
          <h2 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3">
             <Activity className="text-[#FF8C00]" /> Análise de <span className="text-[#FF8C00]">Ganhos</span>
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.historico}>
                <defs>
                  <linearGradient id="colorGanhos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis dataKey="name" stroke="#333" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #FF8C00', borderRadius: '15px' }}
                  itemStyle={{ color: '#FF8C00', fontWeight: '900' }}
                />
                <Area type="monotone" dataKey="ganhos" stroke="#FF8C00" strokeWidth={4} fill="url(#colorGanhos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Divisão de Sócios Fundadores */}
        <div className="bg-[#0A0A0A] border border-[#1A1A1A] p-10 rounded-[3rem] flex flex-col justify-between shadow-2xl shadow-orange-900/5">
          <div>
            <h2 className="text-xl font-black uppercase italic mb-10 text-[#FF8C00]">Divisão de Lucros</h2>
            <div className="space-y-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="bg-black/40 border border-[#1A1A1A] p-6 rounded-2xl flex justify-between items-center group hover:border-[#FF8C00]/30 transition-all">
                  <div>
                    <span className="text-[9px] font-black uppercase text-gray-600 block mb-1">Sócio Fundador 0{s}</span>
                    <p className="text-2xl font-black italic text-white">R$ {lucroPorSocio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="p-3 bg-[#FF8C00]/5 rounded-xl text-[#FF8C00] font-black text-[10px]">33.3%</div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full bg-[#FF8C00] text-black font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-xs mt-10 hover:bg-[#FF9D29] transition-all shadow-xl shadow-orange-900/20 active:scale-[0.98]">
            Solicitar Saque Integral
          </button>
        </div>
      </div>
    </div>
  )
}