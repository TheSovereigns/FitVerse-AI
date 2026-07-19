"use client"

import { toast } from "sonner"

export const notifications = {
  success: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    return toast.success(message, {
      duration: 3000,
      ...options,
    })
  },

  error: (message: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
    return toast.error(message, {
      duration: 5000,
      ...options,
    })
  },

  info: (message: string, options?: { description?: string }) => {
    return toast.info(message, {
      duration: 3000,
      ...options,
    })
  },

  warning: (message: string, options?: { description?: string }) => {
    return toast.warning(message, {
      duration: 4000,
      ...options,
    })
  },

  promise: <T>(
    promise: Promise<T>,
    opts: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((err: unknown) => string)
    }
  ) => {
    return toast.promise(promise, opts)
  },

  dismiss: (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId)
    } else {
      toast.dismiss()
    }
  },
}
