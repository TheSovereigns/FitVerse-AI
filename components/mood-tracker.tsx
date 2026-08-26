"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Lock } from "lucide-react";

interface MoodEntry {
  date: string;
  mood: number;
  note?: string;
}

interface MoodTrackerProps {
  isLocked?: boolean;
}

const moodColors: Record<number, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

export function MoodTracker({ isLocked = false }: MoodTrackerProps) {
  const { t } = useTranslation();
  const moodOptions = [
    { value: 1, emoji: "😊", label: t("mt_great") },
    { value: 2, emoji: "🙂", label: t("mt_good") },
    { value: 3, emoji: "😐", label: t("mt_neutral") },
    { value: 4, emoji: "😟", label: t("mt_bad") },
    { value: 5, emoji: "😰", label: t("mt_terrible") },
  ];
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showInsight, setShowInsight] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setIsLoading(false), 300); return () => clearTimeout(t) }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("mood_entries");
      if (stored) setEntries(JSON.parse(stored));
    } catch (e) {
      logger.error("[MoodTracker] Failed to parse mood_entries:", e)
    }
  }, []);

  const saveEntries = useCallback((newEntries: MoodEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem("mood_entries", JSON.stringify(newEntries));
  }, []);

  const addEntry = () => {
    if (!selectedMood) return;
    const today = new Date().toISOString().split("T")[0]!;
    const existing = entries.findIndex((e) => e.date === today);
    const newEntry: MoodEntry = { date: today, mood: selectedMood, note: note || undefined };
    let updated: MoodEntry[];
    if (existing >= 0) {
      updated = [...entries];
      updated[existing] = newEntry;
    } else {
      updated = [...entries, newEntry];
    }
    saveEntries(updated);
    setSelectedMood(null);
    setNote("");
    setShowInsight(true);
  };

  const chartData = entries.slice(-7).map((e) => ({
    date: new Date(e.date).toLocaleDateString("en", { weekday: "short" }),
    mood: e.mood,
  }));

  const avgMood = entries.length
    ? entries.reduce((s, e) => s + e.mood, 0) / entries.length
    : 0;

  const trend =
    entries.length >= 2
      ? entries[entries.length - 1]!.mood < entries[entries.length - 2]!.mood
        ? "up"
        : entries[entries.length - 1]!.mood > entries[entries.length - 2]!.mood
        ? "down"
        : "flat"
      : "flat";

  const getInsight = () => {
    if (entries.length < 3) return t("mt_insight_keep");
    const recent = entries.slice(-5);
    const avg = recent.reduce((s, e) => s + e.mood, 0) / recent.length;
    if (avg <= 2) return t("mt_insight_great");
    if (avg <= 3) return t("mt_insight_stable");
    if (avg >= 4) return t("mt_insight_breathing");
    return t("mt_insight_consistency");
  };

  if (isLocked) {
    return (
      <div className="glass-strong border border-border rounded-2xl p-6 relative overflow-hidden">
        {isLoading && (
          <div className="space-y-4 animate-fade-in">
            <div className="h-6 w-32 skeleton" />
            <div className="h-20 skeleton" />
          </div>
        )}
        {!isLoading && (
          <>
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("mt_title")}</h2>
        <div className="paywall-card">
          <div className="paywall-icon"><Lock className="w-6 h-6" /></div>
          <h3 className="text-[15px] font-semibold mb-1">{t("mt_pro_feature")}</h3>
          <p className="text-[13px] text-muted-foreground mb-4">{t("mt_unlock")}</p>
          <button className="h-11 rounded-xl bg-brand text-brand-foreground w-full font-medium">Unlock with Pro →</button>
        </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="glass-strong border border-border rounded-2xl p-6">
      {isLoading && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-14 h-14 skeleton" />
            ))}
          </div>
          <div className="h-48 skeleton" />
        </div>
      )}
      {!isLoading && (
        <>
      <h2 className="text-lg font-semibold text-foreground mb-4">{t("mt_title")}</h2>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">{t("mt_how_feeling")}</p>
        <div className="flex gap-2">
          {moodOptions.map((m) => (
            <motion.button
              key={m.value}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedMood(m.value)}
              className={`w-14 h-14 flex items-center justify-center rounded-xl border transition-all ${
                selectedMood === m.value
                  ? "bg-brand/15 border-brand/30 scale-105 shadow-lg shadow-brand/15"
                  : "bg-muted/40 border-transparent hover:bg-muted"
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedMood && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("mt_add_note")}
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={addEntry}
              className="mt-2 px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-opacity"
            >
              {t("mt_save")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">{t("mt_average")}</span>
            <span className="text-foreground font-medium">{avgMood.toFixed(1)}</span>
            {trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
            {trend === "flat" && <Minus className="w-4 h-4 text-muted-foreground" />}
          </div>

          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(0 0% 6%)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, color: '#fff', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  dot={{ fill: "var(--foreground)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowInsight(!showInsight)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
          >
            <span className="font-medium text-foreground">{t("mt_ai_insight")}</span> {getInsight()}
          </motion.button>
        </>
      )}
        </>
      )}
    </div>
  );
}
