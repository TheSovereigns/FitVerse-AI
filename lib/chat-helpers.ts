const WORKOUT_KEYWORDS = ['treino', 'exercício', 'exercicio', 'série', 'serie', 'repetição', 'repeticao', 'musculação', 'musculacao', 'academia', 'peso', 'hipertrofia', 'workout', 'exercise', 'set', 'rep', 'gym', 'lifting', 'strength']
const NUTRITION_KEYWORDS = ['dieta', 'caloria', 'proteína', 'proteina', 'refeição', 'refeicao', 'carboidrato', 'gordura', 'macro', 'nutrição', 'nutricao', 'comida', 'alimentação', 'alimentacao', 'vitamina', 'suplemento', 'suplemento', 'whey', 'creatina', 'nutrition', 'diet', 'calorie', 'protein', 'meal', 'carb', 'fat', 'food', 'eat']
const MOTIVATION_KEYWORDS = ['motivação', 'motivacao', 'desânimo', 'desanimo', 'cansado', 'preguiça', 'preguica', 'desistir', 'motivation', 'tired', 'lazy', 'give up', 'depressed', 'sad', 'ansioso', 'ansiedade', 'anxiety']
const RECOVERY_KEYWORDS = ['dor', 'lesão', 'lesao', 'recuperação', 'recuperacao', 'descanso', 'alongamento', 'stretching', 'pain', 'injury', 'injured', 'sore', 'rest', 'sleep', 'sono', 'dormir', 'cãibra', 'caimbra', 'cramp', 'inflammation', 'inflamação', 'inflamacao']
const SUPPLEMENT_KEYWORDS = ['suplemento', 'suplementação', 'suplementacao', 'creatina', 'whey', 'bcaa', 'beta-alanine', 'glutamina', 'multivitaminico', 'omega 3', 'pre-workout', 'supplement', 'creatine', 'vitamin', 'mineral']

export function detectCategory(message: string): { category: string; subcategory: string } {
  const lower = message.toLowerCase()

  if (SUPPLEMENT_KEYWORDS.some(kw => lower.includes(kw))) {
    return { category: 'supplement', subcategory: 'general' }
  }
  if (WORKOUT_KEYWORDS.some(kw => lower.includes(kw))) {
    if (lower.includes('peito') || lower.includes('chest')) return { category: 'workout', subcategory: 'chest_workout' }
    if (lower.includes('costa') || lower.includes('back')) return { category: 'workout', subcategory: 'back_workout' }
    if (lower.includes('perna') || lower.includes('leg') || lower.includes('quadríceps') || lower.includes('glúteo')) return { category: 'workout', subcategory: 'leg_workout' }
    if (lower.includes('ombro') || lower.includes('shoulder')) return { category: 'workout', subcategory: 'shoulder_workout' }
    if (lower.includes('braço') || lower.includes('bíceps') || lower.includes('tríceps') || lower.includes('arm')) return { category: 'workout', subcategory: 'arm_workout' }
    if (lower.includes('abdômen') || lower.includes('abdominal') || lower.includes('core')) return { category: 'workout', subcategory: 'core_workout' }
    return { category: 'workout', subcategory: 'general' }
  }
  if (NUTRITION_KEYWORDS.some(kw => lower.includes(kw))) {
    if (lower.includes('proteína') || lower.includes('protein')) return { category: 'nutrition', subcategory: 'protein_intake' }
    if (lower.includes('caloria') || lower.includes('calorie')) return { category: 'nutrition', subcategory: 'calorie_tracking' }
    if (lower.includes('receita') || lower.includes('recipe') || lower.includes('cozinhar') || lower.includes('cook')) return { category: 'nutrition', subcategory: 'recipes' }
    return { category: 'nutrition', subcategory: 'general' }
  }
  if (MOTIVATION_KEYWORDS.some(kw => lower.includes(kw))) {
    return { category: 'motivation', subcategory: 'general' }
  }
  if (RECOVERY_KEYWORDS.some(kw => lower.includes(kw))) {
    if (lower.includes('dor') || lower.includes('pain') || lower.includes('lesão') || lower.includes('injury')) return { category: 'recovery', subcategory: 'injury_pain' }
    if (lower.includes('sono') || lower.includes('sleep') || lower.includes('dormir') || lower.includes('rest') || lower.includes('descanso')) return { category: 'recovery', subcategory: 'sleep_rest' }
    return { category: 'recovery', subcategory: 'general' }
  }

  return { category: 'general', subcategory: 'general' }
}

export function detectLanguage(text: string): 'pt' | 'en' {
  const ptWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem', 'que', 'e', 'ou', 'mas', 'como', 'não', 'sim', 'muito', 'mais', 'menos', 'é', 'são', 'foi', 'ser', 'estar', 'ter', 'fazer', 'poder', 'deve', 'precisa', 'quer', 'treino', 'dieta', 'exercício', 'academia', 'proteína', 'caloria', 'saúde']
  const lower = text.toLowerCase()
  const words = lower.split(/\s+/)
  let ptCount = 0
  let enCount = 0

  for (const word of words) {
    if (ptWords.includes(word)) ptCount++
  }

  if (lower.includes(' the ') || lower.includes(' is ') || lower.includes(' are ') || lower.includes(' was ') || lower.includes(' were ') || lower.includes(' have ') || lower.includes(' has ') || lower.includes(' will ') || lower.includes(' would ') || lower.includes(' could ') || lower.includes(' should ')) {
    enCount += 2
  }

  return ptCount >= enCount ? 'pt' : 'en'
}
