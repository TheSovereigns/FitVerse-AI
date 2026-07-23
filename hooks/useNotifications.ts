"use client"

import { useState, useEffect, useCallback } from "react"
import { logger } from "@/lib/logger"

interface NotificationPermission {
  granted: boolean
  denied: boolean
  default: boolean
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true,
  })
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setIsSupported(true)
      updatePermission()
    }
  }, [])

  const updatePermission = () => {
    if (!("Notification" in window)) return
    setPermission({
      granted: Notification.permission === "granted",
      denied: Notification.permission === "denied",
      default: Notification.permission === "default",
    })
  }

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) return false

    try {
      const result = await Notification.requestPermission()
      updatePermission()
      return result === "granted"
    } catch (e) {
      logger.error("[useNotifications] Failed to request permission:", e)
      return false
    }
  }, [])

  const sendNotification = useCallback((
    title: string,
    options?: NotificationOptions
  ) => {
    if (!permission.granted) return

    try {
      new Notification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        ...options,
      } as NotificationOptions)
    } catch (e) {
      logger.error("[useNotifications] Failed to send notification:", e)
    }
  }, [permission.granted])

  const scheduleWorkoutReminder = useCallback((time: string) => {
    if (!permission.granted) return

    const [hours, minutes] = time.split(":").map(Number)
    const now = new Date()
    const scheduled = new Date()
    scheduled.setHours(hours || 0, minutes || 0, 0, 0)

    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1)
    }

    const delay = scheduled.getTime() - now.getTime()

    setTimeout(() => {
      sendNotification("FitVerse AI - Hora de treinar! 💪", {
        body: "Nao esqueca do seu treino de hoje!",
        tag: "workout-reminder",
      })
    }, delay)
  }, [permission.granted, sendNotification])

  const scheduleStreakReminder = useCallback(() => {
    if (!permission.granted) return

    sendNotification("FitVerse AI - Nao quebre sua sequencia! 🔥", {
      body: "Voce esta em uma sequencia! Faca pelo menos um scan hoje.",
      tag: "streak-reminder",
    })
  }, [permission.granted, sendNotification])

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    scheduleWorkoutReminder,
    scheduleStreakReminder,
  }
}
