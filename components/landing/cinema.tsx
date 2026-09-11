"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ReactNode } from "react"
import s from "./experience.module.css"

const gates = [
  "(max-width: 720px)",
  "(orientation: portrait) and (max-width: 1024px)",
  "(orientation: portrait) and (pointer: coarse)",
  "(orientation: landscape) and (pointer: coarse) and (max-height: 560px)",
  "(prefers-reduced-motion: reduce)",
]

export function Cinema({ poster, video: source, children }: { poster: string; video?: string; children: ReactNode }) {
  const region = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const [scrub, setScrub] = useState(false)
  const [ready, setReady] = useState(false)
  const [chapter, setChapter] = useState(0)

  useEffect(() => {
    if (!source) return
    const host = region.current
    const player = video.current
    if (!host || !player) return
    const queries = gates.map((query) => window.matchMedia(query))
    let enabled = false,
      visible = true,
      disposed = false
    let controller: AbortController | undefined
    let objectUrl: string | undefined
    let raf = 0,
      last = 0,
      target = 0,
      shown = 0,
      lastWritten = -1
    let busy = false,
      pending: number | null = null
    let watchdog: ReturnType<typeof setTimeout> | undefined
    let seekWatchdog: ReturnType<typeof setTimeout> | undefined

    function fail() {
      controller?.abort()
      enabled = false
      busy = false
      pending = null
      clearTimeout(watchdog)
      clearTimeout(seekWatchdog)
      cancelAnimationFrame(raf)
      raf = 0
      player!.removeAttribute("src")
      player!.load()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = undefined
      if (!disposed) {
        setReady(false)
        setScrub(false)
        setChapter(0)
      }
    }

    function seek(time: number) {
      if (!Number.isFinite(player!.duration) || Math.abs(player!.currentTime - time) < 0.025) return
      if (busy || player!.seeking) {
        pending = time
        return
      }
      busy = true
      clearTimeout(seekWatchdog)
      seekWatchdog = setTimeout(fail, 4000)
      try {
        player!.currentTime = time
      } catch {
        fail()
      }
    }

    function onSeeked() {
      busy = false
      clearTimeout(seekWatchdog)
      if (pending !== null) {
        const next = pending
        pending = null
        seek(next)
      }
    }

    function tick(now: number) {
      raf = 0
      if (!enabled || !visible || document.hidden) {
        last = 0
        return
      }
      const dt = Math.min(100, last ? now - last : 16.667)
      last = now
      shown += (target - shown) * (1 - Math.pow(0.84, dt / 16.667))
      if (Math.abs(shown - target) < 0.0005) shown = target
      if (Number.isFinite(player!.duration)) seek(shown * Math.max(0, player!.duration - 0.06))
      if (Math.abs(shown - lastWritten) > 0.002 || shown === 0 || shown === 1) {
        host!.style.setProperty("--journey", String(shown))
        const nextChapter = shown < 0.34 ? 0 : shown < 0.68 ? 1 : 2
        setChapter((current) => (current === nextChapter ? current : nextChapter))
        lastWritten = shown
      }
      if (shown !== target) raf = requestAnimationFrame(tick)
      else last = 0
    }

    function onScroll() {
      if (!enabled) return
      const rect = host!.getBoundingClientRect()
      target = Math.min(1, Math.max(0, -rect.top / Math.max(1, host!.offsetHeight - window.innerHeight)))
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick)
    }

    async function load() {
      const current = new AbortController()
      controller = current
      watchdog = setTimeout(() => current.abort(), 20000)
      try {
        const response = await fetch(source!, { signal: current.signal })
        if (!response.ok) throw new Error("Video unavailable")
        const blob = await response.blob()
        clearTimeout(watchdog)
        if (disposed || current.signal.aborted || !enabled) return
        objectUrl = URL.createObjectURL(blob)
        player!.src = objectUrl
        player!.load()
      } catch {
        if (!disposed && enabled && controller === current) fail()
      }
    }

    function applyMode() {
      const next = !queries.some((query) => query.matches)
      if (next === enabled) return
      if (!next) {
        fail()
        host!.style.removeProperty("--journey")
        return
      }
      enabled = true
      setScrub(true)
      shown = target = 0
      void load()
      onScroll()
    }

    function onReady() {
      if (enabled && !disposed) {
        setReady(true)
        onScroll()
      }
    }
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
        last = 0
      } else onScroll()
    }
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      if (visible) onScroll()
      else {
        cancelAnimationFrame(raf)
        raf = 0
        last = 0
      }
    })
    observer.observe(host)
    player.addEventListener("seeked", onSeeked)
    player.addEventListener("canplay", onReady)
    player.addEventListener("error", fail)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    document.addEventListener("visibilitychange", onVisibility)
    queries.forEach((query) => query.addEventListener("change", applyMode))
    applyMode()
    return () => {
      disposed = true
      observer.disconnect()
      queries.forEach((query) => query.removeEventListener("change", applyMode))
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      document.removeEventListener("visibilitychange", onVisibility)
      player.removeEventListener("seeked", onSeeked)
      player.removeEventListener("canplay", onReady)
      player.removeEventListener("error", fail)
      fail()
    }
  }, [source])

  return (
    <section ref={region} className={s.cinema} data-scrub={scrub} data-chapter={chapter} aria-label="Seu próximo passo começa aqui">
      <div className={s.heroStage}>
        <Image
          src={poster}
          alt="Uma pista verde ao amanhecer, com um corredor seguindo seu caminho"
          fill
          priority
          sizes="100vw"
          className={s.heroImage}
        />
        {source && (
          <video
            ref={video}
            className={`${s.heroVideo} ${ready ? s.videoReady : ""}`}
            preload="none"
            muted
            playsInline
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        <div className={s.heroScrim} aria-hidden="true" />
        <div className={s.heroContent}>{children}</div>
        <div className={s.heroBottom}>
          <span>Fitness & nutrição com IA</span>
          <div className={s.journeyLabel}>
            <span>
              {scrub
                ? ["Seu próximo passo.", "Treino. Alimentação. Recuperação.", "Tudo no seu ritmo."][chapter]
                : "Tudo no seu ritmo."}
            </span>
            <span className={s.journeyLine} aria-hidden="true">
              <i />
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
