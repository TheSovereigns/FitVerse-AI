"use client"

import React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressCircleProps {
  value: number;
  target: number;
  label: string;
  unit?: string;
  color?: string;
  className?: string;
}

export function ProgressCircle({ value, target, label, unit = '', color = 'text-primary', className }: ProgressCircleProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const percentage = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 text-center group">
      <div className="relative w-28 h-28 md:w-32 md:h-32">
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-2xl" viewBox="0 0 100 100">
          {/* Círculo de fundo */}
          <circle
            className="text-gray-200 dark:text-white/5"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          {/* Círculo de progresso */}
          <circle
            className={cn("transition-all duration-1000 ease-out", color, className)}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(offset) ? circumference : offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            style={{
              filter: 'drop-shadow(0 0 12px currentColor)',
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-foreground tracking-tighter">{Math.round(value)}{unit}</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground opacity-80 group-hover:text-primary transition-colors">{label}</span>
    </div>
  );
}
