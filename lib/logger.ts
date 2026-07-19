const isDev = process.env.NODE_ENV === 'development'

async function captureToSentry(error: unknown) {
  try {
    const Sentry = await import('@sentry/nextjs')
    if (typeof Sentry.captureException === 'function') {
      Sentry.captureException(error)
    }
  } catch {
    // Sentry not available, ignore
  }
}

export const logger = {
  error: (...args: unknown[]) => {
    if (isDev) console.error('[FitVerse]', ...args)
    if (!isDev) {
      const firstArg = args[0]
      if (firstArg instanceof Error) {
        captureToSentry(firstArg)
      } else if (typeof firstArg === 'string') {
        captureToSentry(new Error(firstArg))
      }
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn('[FitVerse]', ...args)
  },
  info: (...args: unknown[]) => {
    if (isDev) console.log('[FitVerse]', ...args)
  },
  debug: (...args: unknown[]) => {
    if (isDev) console.debug('[FitVerse]', ...args)
  },
}
