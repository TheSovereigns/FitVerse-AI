"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { Check, Plus, X, Flame, Zap } from "lucide-react";

interface Habit {
  id: string;
  name: string;
  icon: string;
  custom: boolean;
}

interface HabitLog {
  date: string;
  completed: string[];
}

interface HabitBuilderProps {}

const defaultHabits: Habit[] = [
  { id: "water", name: "Drink 2L water", icon: "💧", custom: false },
  { id: "sleep", name: "Sleep 7h+", icon: "😴", custom: false },
  { id: "walk", name: "Walk 8000 steps", icon: "🚶", custom: false },
  { id: "vitamins", name: "Take vitamins", icon: "💊", custom: false },
  { id: "meditate", name: "Meditate 5min", icon: "🧘", custom: false },
  { id: "no-sugar", name: "No sugar", icon: "🚫", custom: false },
  { id: "read", name: "Read 10min", icon: "📖", custom: false },
];

export function HabitBuilder({}: HabitBuilderProps) {
  const { t } = useTranslation();
  const [habits, setHabits] = useState<Habit[]>(defaultHabits);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [newHabitName, setNewHabitName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem("habit_list");
      const storedLogs = localStorage.getItem("habit_logs");
      if (storedHabits) setHabits([...defaultHabits, ...JSON.parse(storedHabits)]);
      if (storedLogs) setLogs(JSON.parse(storedLogs));
    } catch (e) {
      logger.error("[HabitBuilder] Failed to parse habit_list/habit_logs:", e)
    }
  }, []);

  const saveLogs = useCallback((newLogs: HabitLog[]) => {
    setLogs(newLogs);
    localStorage.setItem("habit_logs", JSON.stringify(newLogs));
  }, []);

  const today = new Date().toISOString().split("T")[0]!;
  const todayLog = logs.find((l) => l.date === today);
  const completedToday = todayLog?.completed || [];

  const toggleHabit = (id: string) => {
    let updated: HabitLog[];
    if (todayLog) {
      const completed = completedToday.includes(id)
        ? completedToday.filter((c) => c !== id)
        : [...completedToday, id];
      updated = logs.map((l) => (l.date === today ? { ...l, completed } : l));
    } else {
      updated = [...logs, { date: today, completed: [id] }];
    }
    saveLogs(updated);
  };

  const addCustomHabit = () => {
    if (!newHabitName.trim()) return;
    const newHabit: Habit = {
      id: `custom-${Date.now()}`,
      name: newHabitName.trim(),
      icon: "✨",
      custom: true,
    };
    const updated = [...habits, newHabit];
    setHabits(updated);
    const customHabits = updated.filter((h) => h.custom);
    localStorage.setItem("habit_list", JSON.stringify(customHabits));
    setNewHabitName("");
    setShowAdd(false);
  };

  const removeCustomHabit = (id: string) => {
    const updated = habits.filter((h) => h.id !== id);
    setHabits(updated);
    const customHabits = updated.filter((h) => h.custom);
    localStorage.setItem("habit_list", JSON.stringify(customHabits));
  };

  const getStreak = (habitId: string) => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = d.toISOString().split("T")[0];
      const log = logs.find((l) => l.date === dateStr);
      if (log?.completed.includes(habitId)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
      if (i === 0 && dateStr !== today) break;
      if (i > 0) d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  const dailyPercent = habits.length
    ? Math.round((completedToday.length / habits.length) * 100)
    : 0;

  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split("T")[0];
    const log = logs.find((l) => l.date === dateStr);
    const completed = log?.completed.length || 0;
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      rate: habits.length ? Math.round((completed / habits.length) * 100) : 0,
    };
  });

  const totalXp = completedToday.length * 10;

  return (
    <div className="glass-strong border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Habit Builder</h2>
        <div className="flex items-center gap-1 text-sm border-brand/20 bg-brand-muted px-2 py-0.5 rounded-lg">
          <Zap className="w-4 h-4 text-brand" />
          <span>{totalXp} XP</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Daily Progress</span>
          <span className="text-sm font-medium text-foreground">{dailyPercent}%</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${dailyPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {habits.map((habit) => {
          const done = completedToday.includes(habit.id);
          const streak = getStreak(habit.id);
          return (
            <motion.div
              key={habit.id}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              <button
                onClick={() => toggleHabit(habit.id)}
                className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                  done
                    ? "bg-foreground border-foreground text-background"
                    : "border-border bg-card"
                }`}
              >
                {done && <Check className="w-4 h-4" />}
              </button>
              <span className="text-lg">{habit.icon}</span>
              <span className={`text-sm flex-1 ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {habit.name}
              </span>
              {streak > 0 && (
                <span className="flex items-center gap-1 text-xs text-orange-500">
                  <Flame className="w-3 h-3" />
                  {streak}
                </span>
              )}
              {habit.custom && (
                <button onClick={() => removeCustomHabit(habit.id)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-2">Weekly Heatmap</h3>
        <div className="flex gap-1">
          {weeklyData.map((d, i) => (
            <div key={i} className="flex-1 text-center">
              <div
                className="h-16 rounded-lg mb-1"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--foreground) ${d.rate}%, var(--muted))`,
                }}
              />
              <span className="text-xs text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showAdd ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="New habit name"
                className="flex-1 px-3 py-2 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                onKeyDown={(e) => e.key === "Enter" && addCustomHabit()}
              />
              <button
                onClick={addCustomHabit}
                className="px-3 py-2 rounded-xl bg-brand text-white text-sm"
              >
                Add
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Custom Habit
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
