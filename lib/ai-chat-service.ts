import { supabase } from './supabase'
import { logger } from './logger'
import { detectCategory, detectLanguage } from './chat-helpers'

export { detectCategory, detectLanguage }

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
  } catch (e) {
    logger.error("Failed to create conversation:", e)
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
