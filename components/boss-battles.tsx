"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { Swords, Heart, Shield, Zap, Trophy, RotateCcw, Lock, Dumbbell, ScanLine, Droplets, CheckCircle } from "lucide-react";

interface BattleRecord {
  bossName: string;
  date: string;
  won: boolean;
  damageDealt: number;
}

interface BossBattlesProps {
  isLocked?: boolean;
}

const bosses = [
  {
    name: "Sedentary Slime",
    maxHp: 500,
    difficulty: "Easy",
    xpReward: 200,
    weakness: "Workouts",
  },
  {
    name: "Junk Food Dragon",
    maxHp: 800,
    difficulty: "Medium",
    xpReward: 350,
    weakness: "Food Scans",
  },
  {
    name: "Stress Phantom",
    maxHp: 1200,
    difficulty: "Hard",
    xpReward: 500,
    weakness: "Meditation",
  },
];

const taskDamage: Record<string, number> = {
  workout: 50,
  scan: 25,
  water: 15,
  habit: 20,
};

export function BossBattles({ isLocked = false }: BossBattlesProps) {
  const { t } = useTranslation();
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const [bossHp, setBossHp] = useState(0);
  const [battleHistory, setBattleHistory] = useState<BattleRecord[]>([]);
  const [showVictory, setShowVictory] = useState(false);
  const [showDefeat, setShowDefeat] = useState(false);
  const [battleStarted, setBattleStarted] = useState(false);

  const boss = bosses[currentBossIndex];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("boss_history");
      if (stored) setBattleHistory(JSON.parse(stored));
    } catch {}
    setBossHp(boss.maxHp);
  }, [currentBossIndex, boss.maxHp]);

  const startBattle = () => {
    setBossHp(boss.maxHp);
    setBattleStarted(true);
    setShowVictory(false);
    setShowDefeat(false);
  };

  const dealDamage = (type: string) => {
    if (!battleStarted || bossHp <= 0) return;
    const damage = taskDamage[type] || 0;
    const newHp = Math.max(0, bossHp - damage);
    setBossHp(newHp);

    if (newHp <= 0) {
      setShowVictory(true);
      setBattleStarted(false);
      const record: BattleRecord = {
        bossName: boss.name,
        date: new Date().toISOString(),
        won: true,
        damageDealt: boss.maxHp,
      };
      const updated = [...battleHistory, record];
      setBattleHistory(updated);
      localStorage.setItem("boss_history", JSON.stringify(updated));
    }
  };

  const nextBoss = () => {
    const next = (currentBossIndex + 1) % bosses.length;
    setCurrentBossIndex(next);
    setBattleStarted(false);
    setShowVictory(false);
    setShowDefeat(false);
  };

  const hpPercent = (bossHp / boss.maxHp) * 100;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  };

  if (isLocked) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center">
            <Lock className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
            <p className="text-foreground font-medium">Pro Feature</p>
            <p className="text-sm text-muted-foreground">Unlock boss battles</p>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          <h2 className="text-lg font-semibold text-foreground mb-4">Boss Battles</h2>
          <div className="p-4 rounded-xl border border-border">
            <p className="text-foreground">{boss.name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Swords className="w-5 h-5 text-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Boss Battles</h2>
      </div>

      <div className="mb-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-medium text-foreground">{boss.name}</h3>
            <p className="text-xs text-muted-foreground">{boss.difficulty} • Weak to {boss.weakness}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{boss.xpReward} XP</p>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">HP</span>
            <span className="text-xs text-muted-foreground">{bossHp}/{boss.maxHp}</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-foreground rounded-full"
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {!battleStarted && !showVictory && (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={startBattle}
          className="w-full px-4 py-3 rounded-xl bg-foreground text-background text-sm font-medium mb-4"
        >
          <Swords className="w-4 h-4 inline mr-2" />
          Start Battle
        </motion.button>
      )}

      {battleStarted && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { type: "workout", label: "Workout", icon: Dumbbell, damage: taskDamage.workout },
            { type: "scan", label: "Food Scan", icon: ScanLine, damage: taskDamage.scan },
            { type: "water", label: "Drink Water", icon: Droplets, damage: taskDamage.water },
            { type: "habit", label: "Complete Habit", icon: CheckCircle, damage: taskDamage.habit },
          ].map((task) => (
            <motion.button
              key={task.type}
              whileTap={{ scale: 0.95 }}
              onClick={() => dealDamage(task.type)}
              className="p-3 rounded-xl border border-border bg-card text-left hover:bg-muted transition-colors"
            >
              <task.icon className="w-4 h-4 text-muted-foreground mb-1" />
              <p className="text-sm text-foreground">{task.label}</p>
              <p className="text-xs text-muted-foreground">{task.damage} DMG</p>
            </motion.button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showVictory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center p-6 rounded-xl border border-border bg-card mb-4"
          >
            <Trophy className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Victory!</h3>
            <p className="text-sm text-muted-foreground mb-3">
              You defeated {boss.name}! Earned {boss.xpReward} XP
            </p>
            <button
              onClick={nextBoss}
              className="px-4 py-2 rounded-xl bg-foreground text-background text-sm font-medium"
            >
              Next Boss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {battleHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-2">Battle History</h3>
          <div className="space-y-1">
            {battleHistory.slice(-3).reverse().map((record, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                {record.won ? (
                  <Trophy className="w-3 h-3 text-green-500" />
                ) : (
                  <Heart className="w-3 h-3 text-red-500" />
                )}
                <span>{record.bossName}</span>
                <span className="ml-auto">{new Date(record.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
