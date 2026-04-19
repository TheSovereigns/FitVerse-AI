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
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="month" 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))"
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `R$${value/1000}k`} 
        />
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--popover))",
            borderColor: "hsl(var(--border))",
            color: "hsl(var(--popover-foreground))",
            borderRadius: "var(--radius)",
            borderWidth: "1px",
            backdropFilter: "blur(4px)",
            boxShadow: "none",
          }}
          cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '3 3' }}
        />
        <Area type="monotone" dataKey="brl" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorBRL)" />
        <Area type="monotone" dataKey="usd" stroke="hsl(var(--chart-2))" strokeWidth={2} fillOpacity={1} fill="url(#colorUSD)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}