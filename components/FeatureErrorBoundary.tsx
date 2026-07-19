"use client"

import React from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class FeatureErrorBoundary extends React.Component<
  { children: React.ReactNode; featureName?: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; featureName?: string }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[FeatureErrorBoundary] Error in ${this.props.featureName || 'feature'}:`, error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            Algo deu errado
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {this.props.featureName
              ? `Ocorreu um erro ao carregar ${this.props.featureName}.`
              : "Ocorreu um erro inesperado."}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="h-12 rounded-2xl bg-primary text-primary-foreground"
          >
            Tentar novamente
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
