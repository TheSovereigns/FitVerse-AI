// Labels used by the product screens, kept together for the two supported locales.
export const productCopy: Record<string, readonly [string, string]> = {
  analytics_title: ["Análises", "Analytics"],
  analytics_subtitle: ["Seu progresso detalhado", "Your progress in detail"],
  analytics_no_data: ["Nenhum dado ainda", "No data yet"],
  analytics_empty_title: ["Comece a registrar seus dados", "Start tracking your activity"],
  analytics_empty_subtitle: ["Registre medidas, alimentos e treinos para acompanhar sua evolução.", "Track measurements, food and workouts to follow your progress."],
  analytics_weight: ["Peso ao longo do tempo", "Weight over time"],
  analytics_weight_empty: ["Registre suas medidas corporais", "Record your body measurements"],
  analytics_macros: ["Distribuição de nutrientes", "Macro distribution"],
  analytics_macros_empty: ["Escaneie alimentos para ver seus nutrientes", "Scan food to see your macros"],
  analytics_workouts: ["Treinos por semana", "Weekly workouts"],
  analytics_workouts_empty: ["Complete treinos para ver o gráfico", "Complete workouts to see your chart"],
  analytics_xp: ["Experiência acumulada", "Total experience"],
  analytics_xp_empty: ["Ganhe XP escaneando e treinando", "Earn XP by scanning and training"],
  streak_calendar_title: ["Calendário de atividade", "Activity calendar"],
  streak_calendar_subtitle: ["Sua consistência nos últimos três meses", "Your consistency over the last three months"],
  streak_calendar_day: ["dia", "day"],
  streak_calendar_days: ["dias", "days"],
  streak_calendar_best: ["recorde", "best"],
  streak_calendar_active: ["ativos", "active"],
  achievements: ["Conquistas", "Achievements"],
  "category.scan": ["Alimentação", "Nutrition"],
  "category.workout": ["Treinos", "Workouts"],
  "category.streak": ["Consistência", "Consistency"],
  "category.health": ["Saúde", "Health"],
  chatbot_welcome: ["O que vamos cuidar hoje?", "What shall we work on today?"],
  chatbot_welcome_desc: ["Converse sobre sua alimentação, seus treinos e sua rotina.", "Talk about your nutrition, training and daily routine."],
}

for (const n of [1, 10, 50, 100]) {
  const key = n === 1 ? "firstScan" : `scan${n}`
  productCopy[`ach.${key}.name`] = [n === 1 ? "Primeiro alimento" : `${n} alimentos registrados`, n === 1 ? "First food scan" : `${n} foods recorded`]
  productCopy[`ach.${key}.desc`] = [`Escaneie ${n} alimento${n === 1 ? "" : "s"}.`, `Scan ${n} food item${n === 1 ? "" : "s"}.`]
}
for (const n of [1, 10, 50]) {
  productCopy[`ach.workout${n}.name`] = [`${n} treino${n === 1 ? "" : "s"} concluído${n === 1 ? "" : "s"}`, `${n} workout${n === 1 ? "" : "s"} completed`]
  productCopy[`ach.workout${n}.desc`] = [`Complete ${n} treino${n === 1 ? "" : "s"}.`, `Complete ${n} workout${n === 1 ? "" : "s"}.`]
}
for (const n of [3, 7, 30, 100]) {
  productCopy[`ach.streak${n}.name`] = [`${n} dias de consistência`, `${n} days of consistency`]
  productCopy[`ach.streak${n}.desc`] = [`Mantenha sua atividade por ${n} dias seguidos.`, `Stay active for ${n} consecutive days.`]
}
productCopy["ach.hydration7.name"] = ["Hidratação em dia", "Staying hydrated"]
productCopy["ach.hydration7.desc"] = ["Registre sua hidratação durante 7 dias.", "Track your hydration for 7 days."]
