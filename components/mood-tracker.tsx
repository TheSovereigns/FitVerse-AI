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

const moodOptions = [
  { value: 1, emoji: "😊", label: "Great" },
  { value: 2, emoji: "🙂", label: "Good" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "😟", label: "Bad" },
  { value: 5, emoji: "😰", label: "Terrible" },
];

const moodColors: Record<number, string> = {
  1: "#22c55e",
  2: "#84cc16",
  3: "#eab308",
  4: "#f97316",
  5: "#ef4444",
};

export function MoodTracker({ isLocked = false }: MoodTrackerProps) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [showInsight, setShowInsight] = useState(false);

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
    if (entries.length < 3) return "Keep logging to see patterns.";
    const recent = entries.slice(-5);
    const avg = recent.reduce((s, e) => s + e.mood, 0) / recent.length;
    if (avg <= 2) return "You've been feeling great! Keep it up.";
    if (avg <= 3) return "Mood is stable. Consider adding exercise to boost it.";
    if (avg >= 4) return "Try breathing exercises or a walk to improve your mood.";
    return "Consistency is key. Track daily for better insights.";
  };

  if (isLocked) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-foreground font-medium">Pro Feature</p>
            <p className="text-sm text-muted-foreground">Unlock mood tracking</p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          <h2 className="text-lg font-semibold text-foreground mb-4">Mood Tracker</h2>
          <div className="flex gap-2">
            {moodOptions.map((m) => (
              <button key={m.value} className="text-2xl p-2 rounded-xl bg-muted">
                {m.emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Mood Tracker</h2>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">How are you feeling today?</p>
        <div className="flex gap-2">
          {moodOptions.map((m) => (
            <motion.button
              key={m.value}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedMood(m.value)}
              className={`text-2xl p-2 rounded-xl border transition-colors ${
                selectedMood === m.value
                  ? "border-foreground bg-muted"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              {m.emoji}
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
              placeholder="Add a note (optional)"
              className="w-full px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={addEntry}
              className="mt-2 px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Save Mood
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {entries.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-muted-foreground">Average:</span>
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
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                  }}
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
            <span className="font-medium text-foreground">AI Insight:</span> {getInsight()}
          </motion.button>
        </>
      )}
    </div>
  );
}
