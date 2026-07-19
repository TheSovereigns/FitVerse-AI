"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import {
  Trophy,
  Target,
  Droplets,
  Dumbbell,
  ScanLine,
  ChevronRight,
  Medal,
} from "lucide-react";

interface SeasonProgress {
  seasonId: string;
  startDate: string;
  completedChallenges: number[];
  totalXp: number;
}

interface SeasonHistoryEntry {
  seasonId: string;
  name: string;
  completed: boolean;
  xpEarned: number;
  badge?: string;
}

interface SeasonSystemProps {}

const currentSeason = {
  id: "s3",
  name: "Summer Shred",
  description: "30-day summer fitness challenge",
  totalDays: 30,
  challenges: [
    { day: 1, workouts: 1, scans: 2, water: 2 },
    { day: 5, workouts: 1, scans: 3, water: 2 },
    { day: 10, workouts: 2, scans: 3, water: 3 },
    { day: 15, workouts: 2, scans: 4, water: 3 },
    { day: 20, workouts: 2, scans: 5, water: 3 },
    { day: 25, workouts: 3, scans: 5, water: 4 },
    { day: 30, workouts: 3, scans: 5, water: 4 },
  ],
  rewards: [
    { day: 10, badge: "Early Bird", xp: 100 },
    { day: 20, badge: "Champion", xp: 250 },
    { day: 30, badge: "Legend", xp: 500 },
  ],
};

function getLeaderboard(userXp: number) {
  const names = ["FitQueen", "GymRat99", "YogaMaster", "CardioKing"]
  const avatars = ["👑", "🐀", "🧘", "🏃"]
  const entries = names.map((name, i) => ({
    rank: i + 1,
    name,
    xp: Math.max(0, Math.floor(userXp * (1.8 - i * 0.3))),
    avatar: avatars[i]!,
  }))
  entries.push({ rank: 5, name: "Você", xp: userXp, avatar: "💪" })
  entries.sort((a, b) => b.xp - a.xp)
  return entries.map((e, i) => ({ ...e, rank: i + 1, isUser: e.name === "Você" }))
}

const seasonHistory: SeasonHistoryEntry[] = [];

export function SeasonSystem({}: SeasonSystemProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState<SeasonProgress | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("season_progress");
      if (stored) {
        setProgress(JSON.parse(stored));
      } else {
        const initial: SeasonProgress = {
          seasonId: currentSeason.id,
          startDate: new Date().toISOString(),
          completedChallenges: [],
          totalXp: 0,
        };
        setProgress(initial);
        localStorage.setItem("season_progress", JSON.stringify(initial));
      }
    } catch (e) {
      logger.error("[SeasonSystem] Failed to parse/setItem season_progress:", e)
    }
  }, []);

  const daysElapsed = progress
    ? Math.min(
        Math.floor(
          (Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1,
        currentSeason.totalDays
      )
    : 1;

  const daysRemaining = currentSeason.totalDays - daysElapsed;
  const progressPercent = Math.round((daysElapsed / currentSeason.totalDays) * 100);

  const currentChallenge =
    currentSeason.challenges.reduce((best, c) => (c.day <= daysElapsed ? c : best), currentSeason.challenges[0]);

  const todayTasks = [
    { label: `${currentChallenge!.workouts} Workout${currentChallenge!.workouts > 1 ? "s" : ""}`, icon: Dumbbell, done: false },
    { label: `${currentChallenge!.scans} Food Scan${currentChallenge!.scans > 1 ? "s" : ""}`, icon: ScanLine, done: false },
    { label: `${currentChallenge!.water}L Water`, icon: Droplets, done: false },
  ];

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">{currentSeason.name}</h2>
      <p className="text-sm text-muted-foreground mb-4">{currentSeason.description}</p>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Day {daysElapsed} of {currentSeason.totalDays}</span>
          <span className="text-sm text-muted-foreground">{daysRemaining} days left</span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-foreground rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Today&apos;s Challenges</h3>
        <div className="space-y-2">
          {todayTasks.map((task, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <task.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground flex-1">{task.label}</span>
              <div className="w-5 h-5 rounded-lg border border-border" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Leaderboard</h3>
        <div className="space-y-2">
          {getLeaderboard(progress?.totalXp || 0).map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                entry.isUser ? "border-foreground bg-muted" : "border-border"
              }`}
            >
              <span className="w-6 text-center text-sm font-medium text-foreground">
                {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
              </span>
              <span className="text-lg">{entry.avatar}</span>
              <span className="text-sm text-foreground flex-1">{entry.name}</span>
              <span className="text-sm text-muted-foreground">{entry.xp} XP</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Season Rewards</h3>
        <div className="space-y-2">
          {currentSeason.rewards.map((reward, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-foreground">Day {reward.day}</p>
                <p className="text-xs text-muted-foreground">{reward.badge} • {reward.xp} XP</p>
              </div>
              <Medal className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <span>Past Seasons</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showHistory ? "rotate-90" : ""}`} />
        </button>
        {showHistory && (
          <div className="mt-2 space-y-2">
            {seasonHistory.map((s) => (
              <div key={s.seasonId} className="p-3 rounded-xl border border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{s.name}</span>
                  {s.completed && <Trophy className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {s.badge} • {s.xpEarned} XP earned
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
