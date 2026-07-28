"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

interface ErrorBoundaryProps {
  children: React.ReactNode
  featureName?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryClass extends React.Component<
  ErrorBoundaryProps & { t: (key: string) => string },
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps & { t: (key: string) => string }) {
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
      const { t } = this.props
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {t("feb_title")}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {this.props.featureName
              ? t("feb_error_loading").replace("{name}", this.props.featureName)
              : t("feb_unexpected")}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="h-12 rounded-2xl bg-primary text-primary-foreground"
          >
            {t("feb_retry")}
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}

function ErrorBoundaryWrapper({ children, featureName }: ErrorBoundaryProps) {
  const { t } = useTranslation()
  return <ErrorBoundaryClass t={t} featureName={featureName}>{children}</ErrorBoundaryClass>
}

export { ErrorBoundaryWrapper as FeatureErrorBoundary }
