'use client'

import * as React from 'react'
import { MotionConfig } from 'framer-motion'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}><MotionConfig reducedMotion="user">{children}</MotionConfig></NextThemesProvider>
}
