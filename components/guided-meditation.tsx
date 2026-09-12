"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { Play, Pause, RotateCcw, Lock, Clock, Wind } from "lucide-react";

interface MeditationSession {
  date: string;
  exercise: string;
  duration: number;
}

interface GuidedMeditationProps {
  isLocked?: boolean;
}

interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  pattern: number[];
  phases: string[];
  totalDuration: number;
  benefits: string[];
}

const exercises: BreathingExercise[] = [
  {
    id: "box",
    name: "Box Breathing",
    description: "Equal inhale, hold, exhale, hold for calm focus.",
    pattern: [4, 4, 4, 4],
    phases: ["Inhale", "Hold", "Exhale", "Hold"],
    totalDuration: 120,
    benefits: ["Reduces stress", "Improves focus", "Regulates emotions"],
  },
  {
    id: "478",
    name: "4-7-8 Breathing",
    description: "Deep relaxation technique for better sleep.",
    pattern: [4, 7, 8, 0],
    phases: ["Inhale", "Hold", "Exhale", ""],
    totalDuration: 180,
    benefits: ["Promotes sleep", "Reduces anxiety", "Calms nervous system"],
  },
  {
    id: "wim",
    name: "Wim Hof Method",
    description: "Power breathing for energy and resilience.",
    pattern: [2, 0, 2, 0],
    phases: ["Inhale", "", "Exhale", ""],
    totalDuration: 300,
    benefits: ["Boosts energy", "Strengthens immune system", "Increases alertness"],
  },
];

export function GuidedMeditation({ isLocked = false }: GuidedMeditationProps) {
  const { t } = useTranslation();
  const [selectedExercise, setSelectedExercise] = useState<BreathingExercise | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [phaseTimer, setPhaseTimer] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("meditation_sessions");
      if (stored) setSessions(JSON.parse(stored));
    } catch (e) {
      logger.error("[GuidedMeditation] Failed to parse meditation_sessions:", e)
    }
  }, []);

  const stopExercise = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setCurrentPhase(0);
    setPhaseTimer(0);
    setTotalElapsed(0);
  }, []);

  const startExercise = () => {
    if (!selectedExercise) return;
    setIsActive(true);
    setCurrentPhase(0);
    setPhaseTimer(selectedExercise.pattern[0]!);
    setTotalElapsed(0);

    intervalRef.current = setInterval(() => {
      setTotalElapsed((prev) => {
        if (prev >= selectedExercise.totalDuration) {
          stopExercise();
          const session: MeditationSession = {
            date: new Date().toISOString(),
            exercise: selectedExercise.name,
            duration: selectedExercise.totalDuration,
          };
          const updated = [...sessions, session];
          setSessions(updated);
          localStorage.setItem("meditation_sessions", JSON.stringify(updated));
          return 0;
        }
        return prev + 1;
      });

      setPhaseTimer((prev) => {
        if (prev <= 1) {
          setCurrentPhase((p) => {
            let next = (p + 1) % selectedExercise.phases.length;
            while (selectedExercise.pattern[next] === 0) {
              next = (next + 1) % selectedExercise.phases.length;
            }
            return next;
          });
          const nextPhase = (currentPhase + 1) % selectedExercise.phases.length;
          return selectedExercise.pattern[nextPhase]!;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const circleScale = selectedExercise
    ? (() => {
        const phase = selectedExercise.phases[currentPhase];
        const total = selectedExercise.pattern[currentPhase]!
        if (phase === "Inhale") return 0.5 + 0.5 * (1 - phaseTimer / total);
        if (phase === "Exhale") return 1 - 0.5 * (1 - phaseTimer / total);
        return phase === "Hold" ? 1 : 0.5;
      })()
    : 1;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (isLocked) {
    return (
      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-[#0b100d] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-foreground font-medium">Premium Feature</p>
            <p className="text-sm text-muted-foreground">Unlock guided meditation</p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          <h2 className="text-lg font-semibold text-foreground mb-4">Guided Meditation</h2>
          <div className="space-y-2">
            {exercises.map((ex) => (
              <div key={ex.id} className="p-3 rounded-xl border border-border">
                <p className="text-sm text-foreground">{ex.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-white/[0.09] bg-[#0b100d] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <h2 className="text-lg font-semibold text-foreground mb-4">Guided Meditation</h2>

      {!isActive && !selectedExercise && (
        <div className="space-y-3">
          {exercises.map((ex) => (
            <motion.button
              key={ex.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedExercise(ex)}
              className="w-full rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition-colors hover:border-brand/25 hover:bg-brand/[0.045]"
            >
              <div className="flex items-center gap-3 mb-2">
                <Wind className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium text-foreground">{ex.name}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{ex.description}</p>
              <div className="flex gap-2">
                {ex.benefits.map((b, i) => (
                  <span key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.035] px-2 py-1 text-xs text-muted-foreground">
                    {b}
                  </span>
                ))}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {selectedExercise && !isActive && (
        <div className="text-center">
          <h3 className="text-foreground font-medium mb-2">{selectedExercise.name}</h3>
          <p className="text-sm text-muted-foreground mb-6">{selectedExercise.description}</p>

          <div className="flex justify-center gap-4 mb-6">
            {selectedExercise.phases.map((phase, i) =>
              phase ? (
                <div key={i} className="text-center">
                  <p className="text-xs text-muted-foreground">{phase}</p>
                  <p className="text-sm font-medium text-foreground">{selectedExercise.pattern[i]}s</p>
                </div>
              ) : null
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Duration: {formatTime(selectedExercise.totalDuration)}
          </p>

          <div className="flex gap-2 justify-center">
            <button
              onClick={startExercise}
              className="rounded-xl bg-brand px-6 py-2 text-sm font-medium text-[#071009] shadow-[0_10px_28px_rgba(52,211,153,0.22)]"
            >
              <Play className="w-4 h-4 inline mr-1" />
              Start
            </button>
            <button
              onClick={() => setSelectedExercise(null)}
              className="rounded-xl border border-white/[0.1] bg-white/[0.025] px-4 py-2 text-sm text-muted-foreground hover:bg-white/[0.06]"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {isActive && (
        <div className="text-center">
          <div className="relative w-48 h-48 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-brand/70 shadow-[0_0_45px_rgba(52,211,153,0.18)]"
              animate={{ scale: circleScale }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div>
                <p className="text-foreground font-medium">
                  {selectedExercise!.phases[currentPhase]}
                </p>
                <p className="text-2xl font-bold text-foreground">{phaseTimer}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            {formatTime(totalElapsed)} / {formatTime(selectedExercise!.totalDuration)}
          </p>

          <div className="flex gap-2 justify-center">
            <button
              onClick={stopExercise}
              className="rounded-xl border border-white/[0.1] bg-white/[0.025] px-6 py-2 text-sm text-foreground hover:bg-white/[0.06]"
            >
              <Pause className="w-4 h-4 inline mr-1" />
              Stop
            </button>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">Recent Sessions</h3>
          <div className="space-y-1">
            {sessions.slice(-3).reverse().map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{s.exercise}</span>
                <span className="ml-auto">{formatTime(s.duration)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
