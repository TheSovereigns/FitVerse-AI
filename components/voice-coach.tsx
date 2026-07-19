"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Volume2, VolumeX, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"

interface VoiceCoachProps {
  text: string
  lang?: "pt-BR" | "en-US"
  className?: string
  autoPlay?: boolean
}

export function VoiceCoach({ text, lang = "pt-BR", className, autoPlay = false }: VoiceCoachProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setIsSupported(false)
    }
  }, [])

  useEffect(() => {
    if (autoPlay && isSupported && text) {
      speak()
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [text, autoPlay, isSupported])

  const speak = useCallback(() => {
    if (!isSupported || !text) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0

    const voices = window.speechSynthesis.getVoices()
    const ptVoice = voices.find((v) => v.lang.startsWith("pt"))
    if (ptVoice) utterance.voice = ptVoice

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [text, lang, isSupported])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  if (!isSupported) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={isSpeaking ? stop : speak}
      className={cn("rounded-xl", className)}
      disabled={!text}
    >
      {isSpeaking ? (
        <VolumeX className="w-4 h-4" />
      ) : (
        <Volume2 className="w-4 h-4" />
      )}
    </Button>
  )
}
