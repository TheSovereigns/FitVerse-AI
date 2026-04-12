"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RollerPicker } from '@/components/roller-picker';
import { useTranslation } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Scale,
  Ruler,
  Calendar,
  User,
  Activity,
  Dumbbell,
  Zap,
  Target,
  TrendingDown,
  TrendingUp,
  Minus,
  CheckCircle2,
  Award
} from 'lucide-react';

export interface BioPerfil {
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
}

export interface MetabolicPlan {
  macros: {
    calories: number;
    protein: number;
    proteinGrams: number;
    carbs: number;
    carbsGrams: number;
    fat: number;
    fatGrams: number;
  };
  diet?: {
    title: string;
    summary: string;
    meals: Array<{
      name: string;
      items: string[];
    }>;
  };
  prediction: {
    weeks: number;
    explanation: string;
    macroTips?: string[];
  };
}

interface MetabolicPlannerProps {
  onPlanCreated: (plan: MetabolicPlan, profile: BioPerfil) => void;
}

export function MetabolicPlanner({ onPlanCreated }: MetabolicPlannerProps) {
  const { t, locale } = useTranslation();
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('lose_weight');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState(false);

  // Manual input states
  const [manualWeight, setManualWeight] = useState("70");
  const [manualHeight, setManualHeight] = useState("170");
  const [manualAge, setManualAge] = useState("25");

  const handleCalculate = async () => {
    setIsLoading(true);
    setError(null);

    // Use manual input values if enabled, otherwise use roller values
    const w = manualInput ? parseFloat(manualWeight) || weight : weight;
    const h = manualInput ? parseFloat(manualHeight) || height : height;
    const a = manualInput ? parseInt(manualAge) || age : age;

    const profileData = {
      weight: w,
      height: h,
      age: a,
      gender,
      activityLevel,
      goal,
    };

    try {
      let token = ''
      // Get token from localStorage directly
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.includes('sb-') && key.includes('-auth-token')) {
          const storedSession = localStorage.getItem(key)
          if (storedSession) {
            const parsed = JSON.parse(storedSession)
            if (parsed?.access_token) {
              token = parsed.access_token
              break
            }
          }
        }
      }

      const response = await fetch('/api/generate-metabolic-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...profileData, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("mp_error_api").replace("{status}", response.statusText));
      }

      const plan = await response.json();
      onPlanCreated(plan, profileData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t("mp_error_unknown");
      console.error(t("mp_error_calc"), errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const activityOptions = [
    { value: 'sedentary', label: t('mp_sedentary'), desc: t('mp_sedentary_desc'), icon: User },
    { value: 'light', label: t('mp_light'), desc: t('mp_light_desc'), icon: Activity },
    { value: 'moderate', label: t('mp_moderate'), desc: t('mp_moderate_desc'), icon: Dumbbell },
    { value: 'active', label: t('mp_active'), desc: t('mp_active_desc'), icon: Zap },
    { value: 'very_active', label: t('mp_very_active'), desc: t('mp_very_active_desc'), icon: Award },
  ];

  const goalOptions = [
    { value: 'lose_weight', label: t('mp_lose'), icon: TrendingDown },
    { value: 'maintain', label: t('mp_maintain'), icon: Minus },
    { value: 'gain_muscle', label: t('mp_gain'), icon: TrendingUp },
  ];

  return (
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-5 animate-fade-in px-2 md:px-4">
      {/* Header */}
      <div className="text-center space-y-2 mb-6 group cursor-default">
        <div className="inline-flex items-center justify-center p-4 rounded-full glass-strong mb-1 apple-glow transition-transform duration-700 group-hover:scale-105">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl md:text-4xl font-black tracking-tight text-foreground bg-clip-text">
          {t('mp_title')}
        </h1>
        <p className="text-muted-foreground text-sm md:text-lg font-medium max-w-2xl mx-auto text-balance opacity-70">
          {t('mp_subtitle')}
        </p>
      </div>

      <div className="grid gap-5">
        {/* Section 1: Basic Info */}
        <div className="bg-card glass-strong border-white/20 shadow-xl rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 space-y-5 haptic-press transition-all duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-black flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-primary/20 rounded-xl">
                <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              {t('mp_body_data')}
            </h2>
            <button
              onClick={() => setManualInput(!manualInput)}
              className="text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 hover:border-primary/50 transition-all"
            >
              {manualInput ? t("mp_toggle_scroll") : t("mp_toggle_manual")}
            </button>
          </div>

          {manualInput ? (
            <div className="grid grid-cols-3 gap-3 md:gap-5 py-2">
              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest opacity-40 block text-center">{t('mp_weight')}</Label>
                <Input
                  type="number"
                  value={manualWeight}
                  onChange={(e) => setManualWeight(e.target.value)}
                  className="text-center font-black text-lg bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest opacity-40 block text-center">{t('mp_height')}</Label>
                <Input
                  type="number"
                  value={manualHeight}
                  onChange={(e) => setManualHeight(e.target.value)}
                  className="text-center font-black text-lg bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[8px] font-black uppercase tracking-widest opacity-40 block text-center">{t('mp_age')}</Label>
                <Input
                  type="number"
                  value={manualAge}
                  onChange={(e) => setManualAge(e.target.value)}
                  className="text-center font-black text-lg bg-white/5 border-white/10 rounded-xl h-12"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 md:gap-5 py-2">
              <RollerPicker 
                min={30} max={200} 
                value={weight} 
                onChange={setWeight} 
                label={t('mp_weight')} 
                unit="kg" 
              />
              <RollerPicker 
                min={120} max={230} 
                value={height} 
                onChange={setHeight} 
                label={t('mp_height')} 
                unit="cm" 
              />
              <RollerPicker 
                min={13} max={100} 
                value={age} 
                onChange={setAge} 
                label={t('mp_age')} 
                unit={t('mp_age_unit')} 
              />
            </div>
          )}

          <div className="pt-4">
            <Label className="text-[8px] font-black uppercase tracking-[0.3em] mb-4 block opacity-40 text-center">{t('mp_gender')}</Label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/5 dark:bg-white/5 rounded-[1.25rem] md:rounded-[1.5rem] relative">
              {[
                { value: 'male', label: t('mp_male') },
                { value: 'female', label: t('mp_female') }
              ].map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGender(g.value)}
                  className={cn(
                    "relative flex items-center justify-center py-2.5 md:py-3 rounded-[1rem] md:rounded-[1.25rem] transition-all duration-500 font-black tracking-tight z-10 text-xs",
                    gender === g.value ? "text-primary bg-background shadow-lg" : "text-foreground/30 hover:text-foreground/60"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Activity Level */}
        <div className="bg-card glass-strong border-white/20 shadow-xl rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            {t('mp_activity')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
            {activityOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActivityLevel(option.value)}
                className={cn(
                  "flex flex-col items-center text-center p-3 md:p-4 rounded-[1rem] md:rounded-[1.25rem] border-2 transition-all duration-500 h-full haptic-press group",
                  activityLevel === option.value
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,159,10,0.2)]"
                    : "border-white/10 hover:border-primary/40 bg-white/5"
                )}
              >
                <div className={cn(
                  "p-2 md:p-3 rounded-lg md:rounded-xl mb-2 transition-all duration-500 group-hover:scale-105",
                  activityLevel === option.value ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"
                )}>
                  <option.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <span className={cn("font-black tracking-tight mb-1 text-xs", activityLevel === option.value ? "text-primary" : "text-foreground")}>
                  {option.label}
                </span>
                <span className="text-[7px] md:text-[8px] text-muted-foreground font-black uppercase tracking-widest leading-tight opacity-60 group-hover:opacity-100">{option.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Goal */}
        <div className="bg-card glass-strong border-white/20 shadow-xl rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            {t('mp_goal_title')}
          </h2>
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setGoal(option.value)}
                className={cn(
                  "flex items-center gap-3 p-3 md:p-4 rounded-[1rem] md:rounded-[1.25rem] border-2 transition-all duration-500 text-left haptic-press group relative overflow-hidden",
                  goal === option.value
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(255,159,10,0.2)]"
                    : "border-white/10 hover:border-primary/40 bg-white/5"
                )}
              >
                <div className={cn(
                  "p-2 md:p-3 rounded-lg transition-all duration-500 group-hover:scale-105",
                  goal === option.value ? "bg-primary text-white" : "bg-white/10 text-muted-foreground"
                )}>
                  <option.icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div>
                  <span className={cn("block text-xs md:text-sm font-black tracking-tight", goal === option.value ? "text-primary" : "text-foreground")}>
                    {option.label}
                  </span>
                </div>
                {goal === option.value && (
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-4 text-primary ml-auto animate-in zoom-in duration-300" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {error && (
            <div className="p-3 mb-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <Button
            onClick={handleCalculate}
            disabled={isLoading}
            className="w-full h-12 md:h-16 text-base md:text-xl font-black rounded-full shadow-[0_15px_40px_rgba(255,140,0,0.3)] transition-all mesh-gradient text-white haptic-press luminous-edge glass-reflection border border-white/20 uppercase tracking-[0.2em] relative z-10"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                {t('mp_generating')}
              </>
            ) : (
              <>
                {t('mp_generate')}
                <Zap className="ml-2 h-4 w-4 md:h-5 md:w-5" />
              </>
            )}
          </Button>
          <p className="text-[8px] text-center text-muted-foreground mt-3 uppercase tracking-widest opacity-60">
            {t('mp_privacy')}
          </p>
        </div>
      </div>
    </div>
  );
}