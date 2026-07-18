import { supabase } from './supabase'

export type UserContext = {
  goal: string
  weight?: number
  height?: number
  age?: number
  level: string
  restrictions?: string[]
  plan: 'free' | 'premium'
  country: 'BR' | 'US'
}

export type AIMessageRecord = {
  id: string
  conversation_id: string
  user_id: string | null
  user_message: string
  user_message_lang: string
  user_context: Record<string, unknown>
  ai_response: string
  ai_response_lang: string
  model_used: string
  tokens_used: number | null
  response_time_ms: number | null
  category: string | null
  subcategory: string | null
  user_rating: number | null
  user_thumbs_up: boolean | null
  user_flagged: boolean
  flag_reason: string | null
  training_status: string
  edited_response: string | null
  edited_by: string | null
  edited_at: string | null
  created_at: string
}

const WORKOUT_KEYWORDS = ['treino', 'exercício', 'exercicio', 'série', 'serie', 'repetição', 'repeticao', 'musculação', 'musculacao', 'academia', 'peso', 'hipertrofia', 'workout', 'exercise', 'set', 'rep', 'gym', 'lifting', 'strength']
const NUTRITION_KEYWORDS = ['dieta', 'caloria', 'proteína', 'proteina', 'refeição', 'refeicao', 'carboidrato', 'gordura', 'macro', 'nutrição', 'nutricao', 'comida', 'alimentação', 'alimentacao', 'vitamina', 'suplemento', 'suplemento', 'whey', 'creatina', 'nutrition', 'diet', 'calorie', 'protein', 'meal', 'carb', 'fat', 'food', 'eat']
const MOTIVATION_KEYWORDS = ['motivação', 'motivacao', 'desânimo', 'desanimo', 'cansado', 'preguiça', 'preguica', 'desistir', 'motivation', 'tired', 'lazy', 'give up', 'depressed', 'sad', 'ansioso', 'ansiedade', 'anxiety']
const RECOVERY_KEYWORDS = ['dor', 'lesão', 'lesao', 'recuperação', 'recuperacao', 'descanso', 'alongamento', 'stretching', 'pain', 'injury', 'injured', 'sore', 'rest', 'sleep', 'sono', 'dormir', 'cãibra', 'caimbra', 'cramp', 'inflammation', 'inflamação', 'inflamacao']
const SUPPLEMENT_KEYWORDS = ['suplemento', 'suplementação', 'suplementacao', 'creatina', 'whey', 'bcaa', 'beta-alanine', 'glutamina', 'multivitaminico', 'omega 3', 'pre-workout', 'supplement', 'creatine', 'vitamin', 'mineral']

function detectCategory(message: string): { category: string; subcategory: string } {
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

function detectLanguage(text: string): 'pt' | 'en' {
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

export async function saveAIMessage(params: {
  conversationId: string
  userId: string | null
  userMessage: string
  aiResponse: string
  userContext: UserContext
  modelUsed: string
  tokensUsed: number | null
  responseTimeMs: number
}): Promise<void> {
  const { conversationId, userId, userMessage, aiResponse, userContext, modelUsed, tokensUsed, responseTimeMs } = params

  const userMessageLang = detectLanguage(userMessage)
  const aiResponseLang = detectLanguage(aiResponse)
  const { category, subcategory } = detectCategory(userMessage)

  try {
    await supabase.from('ai_messages').insert({
      conversation_id: conversationId,
      user_id: userId,
      user_message: userMessage,
      user_message_lang: userMessageLang,
      user_context: userContext,
      ai_response: aiResponse,
      ai_response_lang: aiResponseLang,
      model_used: modelUsed,
      tokens_used: tokensUsed,
      response_time_ms: responseTimeMs,
      category,
      subcategory,
      training_status: 'raw',
    })
  } catch (error) {
    console.error('Failed to save AI message to dataset:', error)
  }
}

export async function createConversation(userId: string | null, sessionId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: userId, session_id: sessionId })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Failed to create conversation:', error)
      return sessionId
    }
    return data.id
  } catch {
    return sessionId
  }
}

export async function updateMessageFeedback(messageId: string, updates: {
  userThumbsUp?: boolean
  userFlagged?: boolean
  flagReason?: string
  userRating?: number
}): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (updates.userThumbsUp !== undefined) payload.user_thumbs_up = updates.userThumbsUp
  if (updates.userFlagged !== undefined) payload.user_flagged = updates.userFlagged
  if (updates.flagReason !== undefined) payload.flag_reason = updates.flagReason
  if (updates.userRating !== undefined) payload.user_rating = updates.userRating

  try {
    await supabase.from('ai_messages').update(payload).eq('id', messageId)
  } catch (error) {
    console.error('Failed to update message feedback:', error)
  }
}

export async function updateMessageTrainingStatus(messageId: string, status: string, editedResponse?: string, editedBy?: string): Promise<void> {
  const payload: Record<string, unknown> = { training_status: status }
  if (editedResponse) {
    payload.edited_response = editedResponse
    payload.edited_by = editedBy
    payload.edited_at = new Date().toISOString()
  }

  try {
    await supabase.from('ai_messages').update(payload).eq('id', messageId)
  } catch (error) {
    console.error('Failed to update training status:', error)
  }
}

export { detectLanguage, detectCategory }
