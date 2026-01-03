"use client"

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps {
  percentage: number;
  value: string;
  label: string;
  className?: string;
}

export function ProgressCircle({ percentage, value, label, className }: ProgressCircleProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  // Garante que a porcentagem fique entre 0 e 100 para a animação
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clampedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Círculo de fundo */}
          <circle
            className="text-muted/20"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          {/* Círculo de progresso */}
          <circle
            className={cn("transition-all duration-1000 ease-out", className)}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(offset) ? circumference : offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-foreground">{value}</span>
        </div>
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
