"use client"

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

interface RevenueChartProps {
  data: any[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorBRL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF8C00" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          stroke="#444444" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="#444444" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `R$${value/1000}k`} 
        />
        <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "rgba(18, 18, 18, 0.9)", 
            border: "1px solid #1F1F1F", 
            borderRadius: "16px",
            backdropFilter: "blur(4px)"
          }}
          cursor={{ stroke: '#FF8C00', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area type="monotone" dataKey="brl" stroke="#FF8C00" strokeWidth={2} fillOpacity={1} fill="url(#colorBRL)" />
        <Area type="monotone" dataKey="usd" stroke="#8884d8" strokeWidth={2} fillOpacity={1} fill="url(#colorUSD)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}