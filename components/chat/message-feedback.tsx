"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ThumbsUp, ThumbsDown, Flag, Check, X, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/lib/i18n"
import { updateMessageFeedback } from "@/lib/ai-chat-service"

type FeedbackState = "none" | "thumbs_up" | "thumbs_down" | "flagged" | "show_reason"

const FLAG_REASONS = [
  { value: "incorrect", key: "feedback_reason_incorrect" },
  { value: "too_generic", key: "feedback_reason_generic" },
  { value: "misunderstood", key: "feedback_reason_misunderstood" },
  { value: "other", key: "feedback_reason_other" },
] as const

interface MessageFeedbackProps {
  messageId: string
  onFeedbackSubmitted?: (state: FeedbackState) => void
}

export function MessageFeedback({ messageId, onFeedbackSubmitted }: MessageFeedbackProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<FeedbackState>("none")
  const [selectedReason, setSelectedReason] = useState<string>("")
  const [showThanks, setShowThanks] = useState(false)

  const handleThumbsUp = useCallback(async () => {
    setState("thumbs_up")
    setShowThanks(true)
    setTimeout(() => setShowThanks(false), 2000)
    await updateMessageFeedback(messageId, { userThumbsUp: true })
    onFeedbackSubmitted?.("thumbs_up")
  }, [messageId, onFeedbackSubmitted])

  const handleThumbsDown = useCallback(() => {
    setState("show_reason")
  }, [])

  const handleFlag = useCallback(async () => {
    setState("flagged")
    setShowThanks(true)
    setTimeout(() => setShowThanks(false), 2000)
    await updateMessageFeedback(messageId, { userFlagged: true, flagReason: "user_flagged" })
    onFeedbackSubmitted?.("flagged")
  }, [messageId, onFeedbackSubmitted])

  const handleReasonSubmit = useCallback(async () => {
    if (!selectedReason) return
    setState("thumbs_down")
    await updateMessageFeedback(messageId, { userThumbsUp: false, flagReason: selectedReason })
    onFeedbackSubmitted?.("thumbs_down")
  }, [messageId, selectedReason, onFeedbackSubmitted])

  const handleCancel = useCallback(() => {
    setState("none")
    setSelectedReason("")
  }, [])

  return (
    <div className="flex items-center gap-2 mt-3">
      <AnimatePresence mode="wait">
        {showThanks && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold"
          >
            <Check className="w-3 h-3" />
            <span>{t("feedback_thanks")}</span>
          </motion.div>
        )}

        {state === "none" && !showThanks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1"
          >
            <button
              onClick={handleThumbsUp}
              className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-emerald-400 transition-all active:scale-90"
              aria-label="Thumbs up"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleThumbsDown}
              className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-rose-400 transition-all active:scale-90"
              aria-label="Thumbs down"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFlag}
              className="p-1.5 rounded-full hover:bg-white/10 text-muted-foreground hover:text-amber-400 transition-all active:scale-90"
              aria-label="Flag"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {state === "thumbs_up" && !showThanks && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-emerald-400"
          >
            <ThumbsUp className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-bold">{t("feedback_helpful")}</span>
          </motion.div>
        )}

        {state === "flagged" && !showThanks && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 text-amber-400"
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{t("feedback_reported")}</span>
          </motion.div>
        )}

        {state === "show_reason" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3 h-3 text-rose-400" />
              <span className="text-xs font-bold text-rose-400">{t("feedback_why_bad")}</span>
              <button onClick={handleCancel} className="ml-auto p-0.5 hover:bg-white/10 rounded">
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FLAG_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all",
                    selectedReason === reason.value
                      ? "border-rose-400 bg-rose-400/20 text-rose-400"
                      : "border-white/10 text-muted-foreground hover:border-white/30"
                  )}
                >
                  {t(reason.key)}
                </button>
              ))}
            </div>
            <button
              onClick={handleReasonSubmit}
              disabled={!selectedReason}
              className={cn(
                "mt-2 px-4 py-1 rounded-full text-xs font-bold transition-all",
                selectedReason
                  ? "bg-rose-500 text-white hover:bg-rose-600"
                  : "bg-white/5 text-muted-foreground/30 cursor-not-allowed"
              )}
            >
              {t("feedback_send")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
