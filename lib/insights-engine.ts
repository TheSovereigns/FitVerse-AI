export interface Insight {
  id: string
  icon: string
  text: string
  type: "positive" | "warning" | "info" | "tip"
  priority: number
}

interface MacroTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
}

interface ScanProduct {
  macros?: MacroTotals
  healthScore?: { overall?: number }
  novaClassification?: { group?: number }
  alerts?: Array<{ severity?: string; title?: string }>
  positivePoints?: string[]
  negativePoints?: string[]
  productName?: string
}

interface MetabolicPlan {
  macros?: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  }
}

function pct(current: number, goal: number): number {
  return goal > 0 ? Math.round((current / goal) * 100) : 0
}

export function generateDailyInsights(
  scans: ScanProduct[],
  plan: MetabolicPlan | null,
  locale: string
): Insight[] {
  if (!scans.length) return []

  const isEn = locale === "en-US"
  const insights: Insight[] = []

  const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  let lowScoreCount = 0
  let highNovaCount = 0
  let alertCount = 0

  for (const scan of scans) {
    const m = scan.macros || ({} as MacroTotals)
    totals.calories += m.calories || 0
    totals.protein += m.protein || 0
    totals.carbs += m.carbs || 0
    totals.fat += m.fat || 0
    totals.fiber += m.fiber || 0
    totals.sugar += m.sugar || 0
    totals.sodium += m.sodium || 0
    if ((scan.healthScore?.overall || 0) < 40) lowScoreCount++
    if ((scan.novaClassification?.group || 0) >= 4) highNovaCount++
    alertCount += (scan.alerts?.length || 0)
  }

  const goals = plan?.macros
  const isEn_ = isEn

  // Protein insight
  if (goals?.protein) {
    const p = pct(totals.protein, goals.protein)
    if (p < 30) {
      insights.push({
        id: "low-protein",
        icon: "🥩",
        text: isEn_
          ? `Only ${p}% of protein goal (${Math.round(totals.protein)}/${goals.protein}g). Add lean protein like chicken, eggs or whey.`
          : `Apenas ${p}% da meta de proteína (${Math.round(totals.protein)}/${goals.protein}g). Adicione proteína magra como frango, ovos ou whey.`,
        type: "warning",
        priority: 1,
      })
    } else if (p >= 80) {
      insights.push({
        id: "good-protein",
        icon: "💪",
        text: isEn_
          ? `Great! ${p}% of protein goal reached. Keep it up!`
          : `Ótimo! ${p}% da meta de proteína atingida. Continue assim!`,
        type: "positive",
        priority: 2,
      })
    }
  }

  // Calorie insight
  if (goals?.calories) {
    const p = pct(totals.calories, goals.calories)
    if (p > 100) {
      insights.push({
        id: "over-calories",
        icon: "⚠️",
        text: isEn_
          ? `You've exceeded your calorie goal by ${p - 100}% (${Math.round(totals.calories)}/${goals.calories} kcal). Consider lighter meals for the rest of the day.`
          : `Você ultrapassou a meta calórica em ${p - 100}% (${Math.round(totals.calories)}/${goals.calories} kcal). Considere refeições mais leves no resto do dia.`,
        type: "warning",
        priority: 1,
      })
    } else if (p >= 50 && p <= 80) {
      insights.push({
        id: "calorie-ok",
        icon: "📊",
        text: isEn_
          ? `${p}% of calorie goal consumed. ${Math.round(goals.calories - totals.calories)} kcal remaining today.`
          : `${p}% da meta calórica consumida. ${Math.round(goals.calories - totals.calories)} kcal restantes hoje.`,
        type: "info",
        priority: 3,
      })
    }
  }

  // Sugar insight
  if (totals.sugar > 50) {
    insights.push({
      id: "high-sugar",
      icon: "🍬",
      text: isEn_
        ? `${Math.round(totals.sugar)}g of sugar consumed — above the recommended daily limit (50g). Try reducing sugary foods.`
        : `${Math.round(totals.sugar)}g de açúcar consumido — acima do limite diário recomendado (50g). Tente reduzir alimentos açucarados.`,
      type: "warning",
      priority: 1,
    })
  }

  // Sodium insight
  if (totals.sodium > 2000) {
    insights.push({
      id: "high-sodium",
      icon: "🧂",
      text: isEn_
        ? `Sodium intake is ${Math.round(totals.sodium)}mg (limit: 2300mg). Drink more water to compensate.`
        : `Ingestão de sódio em ${Math.round(totals.sodium)}mg (limite: 2300mg). Beba mais água para compensar.`,
      type: "warning",
      priority: 2,
    })
  }

  // Ultra-processed insight
  if (highNovaCount > 0) {
    insights.push({
      id: "ultra-processed",
      icon: "🏭",
      text: isEn_
        ? `${highNovaCount} ultra-processed food(s) detected. Try choosing less processed options when possible.`
        : `${highNovaCount} alimento(s) ultra-processado(s) detectado(s). Tente escolher opções menos processadas quando possível.`,
      type: "tip",
      priority: 2,
    })
  }

  // Low quality scans
  if (lowScoreCount > 0) {
    insights.push({
      id: "low-quality",
      icon: "📉",
      text: isEn_
        ? `${lowScoreCount} food(s) scored below 40/100. Consider swapping for healthier alternatives.`
        : `${lowScoreCount} alimento(s) com nota abaixo de 40/100. Considere trocar por alternativas mais saudáveis.`,
      type: "warning",
      priority: 2,
    })
  }

  // Fiber insight
  if (goals && totals.fiber < 10 && scans.length >= 2) {
    insights.push({
      id: "low-fiber",
      icon: "🥦",
      text: isEn_
        ? `Low fiber intake (${Math.round(totals.fiber)}g). Add vegetables, fruits, or whole grains.`
        : `Baixa ingestão de fibra (${Math.round(totals.fiber)}g). Adicione vegetais, frutas ou grãos integrais.`,
      type: "tip",
      priority: 3,
    })
  }

  // Meal balance tip
  if (scans.length >= 2) {
    const carbPct = goals?.carbs ? pct(totals.carbs, goals.carbs) : 0
    const fatPct = goals?.fat ? pct(totals.fat, goals.fat) : 0
    if (carbPct > 90 && fatPct < 40) {
      insights.push({
        id: "imbalance-carb",
        icon: "⚖️",
        text: isEn_
          ? `High carbs (${carbPct}%) but low fat (${fatPct}%). Add healthy fats like avocado, olive oil, or nuts.`
          : `Muitos carboidratos (${carbPct}%) mas pouca gordura (${fatPct}%). Adicione gorduras saudáveis como abacate, azeite ou castanhas.`,
        type: "tip",
        priority: 3,
      })
    }
  }

  // Sort by priority and return top 4
  return insights.sort((a, b) => a.priority - b.priority).slice(0, 4)
}

export function generatePostScanInsight(
  scan: ScanProduct,
  todayScans: ScanProduct[],
  plan: MetabolicPlan | null,
  locale: string
): Insight[] {
  const isEn = locale === "en-US"
  const insights: Insight[] = []
  const m = scan.macros || ({} as MacroTotals)

  // Health score
  const score = scan.healthScore?.overall || 0
  if (score >= 70) {
    insights.push({
      id: "scan-good",
      icon: "✅",
      text: isEn
        ? `This food scored ${score}/100 — a healthy choice!`
        : `Este alimento pontuou ${score}/100 — uma escolha saudável!`,
      type: "positive",
      priority: 1,
    })
  } else if (score < 40) {
    insights.push({
      id: "scan-bad",
      icon: "⚠️",
      text: isEn
        ? `Low score (${score}/100). Consider healthier alternatives next time.`
        : `Nota baixa (${score}/100). Considere alternativas mais saudáveis na próxima vez.`,
      type: "warning",
      priority: 1,
    })
  }

  // Add to daily totals
  const totals: MacroTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0 }
  for (const s of todayScans) {
    const sm = s.macros || ({} as MacroTotals)
    totals.calories += sm.calories || 0
    totals.protein += sm.protein || 0
    totals.carbs += sm.carbs || 0
    totals.fat += sm.fat || 0
    totals.fiber += sm.fiber || 0
    totals.sugar += sm.sugar || 0
    totals.sodium += sm.sodium || 0
  }

  const goals = plan?.macros
  if (goals?.calories) {
    const remaining = goals.calories - totals.calories
    if (remaining < 0) {
      insights.push({
        id: "over-budget",
        icon: "🔴",
        text: isEn
          ? `Over calorie budget by ${Math.abs(Math.round(remaining))} kcal today. Choose light options for remaining meals.`
          : `Acima do orçamento calórico em ${Math.abs(Math.round(remaining))} kcal hoje. Escolha opções leves para as próximas refeições.`,
        type: "warning",
        priority: 1,
      })
    } else {
      insights.push({
        id: "remaining",
        icon: "🍽️",
        text: isEn
          ? `${Math.round(remaining)} kcal remaining today. You're on track!`
          : `${Math.round(remaining)} kcal restantes hoje. Está no caminho certo!`,
        type: "info",
        priority: 3,
      })
    }
  }

  // Sodium warning
  if (totals.sodium > 1800) {
    insights.push({
      id: "sodium-warn",
      icon: "💧",
      text: isEn
        ? `Sodium is high (${Math.round(totals.sodium)}mg). Drink extra water to help flush it out.`
        : `Sódio elevado (${Math.round(totals.sodium)}mg). Beba água extra para ajudar a eliminar.`,
      type: "tip",
      priority: 2,
    })
  }

  // Protein timing
  if (m.protein && m.protein >= 20) {
    insights.push({
      id: "protein-timing",
      icon: "💪",
      text: isEn
        ? `Great protein source (${m.protein}g). Ideal for post-workout recovery.`
        : `Boa fonte de proteína (${m.protein}g). Ideal para recuperação pós-treino.`,
      type: "positive",
      priority: 2,
    })
  }

  return insights.sort((a, b) => a.priority - b.priority).slice(0, 3)
}
