"use client"

import { logger } from "./logger"

interface AuditEvent {
  action: string
  category: "auth" | "data" | "settings" | "subscription" | "admin"
  details?: Record<string, unknown>
  timestamp: string
  userId?: string
}

const auditLog: AuditEvent[] = []
const MAX_LOG_SIZE = 100

export function logAuditEvent(
  action: string,
  category: AuditEvent["category"],
  details?: Record<string, unknown>,
  userId?: string
) {
  const event: AuditEvent = {
    action,
    category,
    details,
    timestamp: new Date().toISOString(),
    userId,
  }

  auditLog.unshift(event)
  if (auditLog.length > MAX_LOG_SIZE) {
    auditLog.pop()
  }

  logger.info(`[Audit] ${category}: ${action}`, details)

  try {
    const stored = localStorage.getItem("fitverse-audit-log")
    const logs = stored ? JSON.parse(stored) : []
    logs.unshift(event)
    if (logs.length > MAX_LOG_SIZE) logs.pop()
    localStorage.setItem("fitverse-audit-log", JSON.stringify(logs))
  } catch {}
}

export function getAuditLog(category?: AuditEvent["category"]): AuditEvent[] {
  try {
    const stored = localStorage.getItem("fitverse-audit-log")
    const logs: AuditEvent[] = stored ? JSON.parse(stored) : []
    return category ? logs.filter((l) => l.category === category) : logs
  } catch {
    return []
  }
}

export function clearAuditLog() {
  auditLog.length = 0
  localStorage.removeItem("fitverse-audit-log")
}
