-- =====================================================
-- FitVerse AI — Dataset de Treinamento para IA
-- Rodar no Supabase SQL Editor
-- =====================================================

-- Tabela principal de conversas
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id uuid NOT NULL,
  created_at timestamp DEFAULT now()
);

-- Tabela de mensagens individuais
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  user_message text NOT NULL,
  user_message_lang text DEFAULT 'pt',

  user_context jsonb DEFAULT '{}',

  ai_response text NOT NULL,
  ai_response_lang text DEFAULT 'pt',
  model_used text DEFAULT 'gemini-2.5-flash',
  tokens_used integer,
  response_time_ms integer,

  category text,
  subcategory text,

  user_rating integer CHECK (user_rating BETWEEN 1 AND 5),
  user_thumbs_up boolean,
  user_flagged boolean DEFAULT false,
  flag_reason text,

  training_status text DEFAULT 'raw',
  edited_response text,
  edited_by uuid REFERENCES profiles(id),
  edited_at timestamp,

  created_at timestamp DEFAULT now()
);

-- Tabela de exportações do dataset
CREATE TABLE IF NOT EXISTS dataset_exports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  exported_by uuid REFERENCES profiles(id),
  format text DEFAULT 'jsonl',
  total_records integer,
  filters_applied jsonb,
  file_url text,
  created_at timestamp DEFAULT now()
);

-- View para estatísticas do dataset
CREATE OR REPLACE VIEW dataset_stats AS
SELECT
  COUNT(*) as total_messages,
  COUNT(*) FILTER (WHERE training_status = 'approved') as approved,
  COUNT(*) FILTER (WHERE training_status = 'edited') as edited,
  COUNT(*) FILTER (WHERE training_status = 'rejected') as rejected,
  COUNT(*) FILTER (WHERE training_status = 'raw') as pending_review,
  COUNT(*) FILTER (WHERE user_thumbs_up = true) as thumbs_up,
  COUNT(*) FILTER (WHERE user_flagged = true) as flagged,
  AVG(user_rating) FILTER (WHERE user_rating IS NOT NULL) as avg_rating,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE user_message_lang = 'pt') as portuguese_messages,
  COUNT(*) FILTER (WHERE user_message_lang = 'en') as english_messages,
  category,
  COUNT(*) as category_count
FROM ai_messages
GROUP BY category;

-- RLS
ALTER TABLE IF EXISTS ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS dataset_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own conversations" ON ai_conversations;
CREATE POLICY "Users see own conversations" ON ai_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own conversations" ON ai_conversations;
CREATE POLICY "Users insert own conversations" ON ai_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users see own messages" ON ai_messages;
CREATE POLICY "Users see own messages" ON ai_messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users insert own messages" ON ai_messages;
CREATE POLICY "Users insert own messages" ON ai_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own messages feedback" ON ai_messages;
CREATE POLICY "Users update own messages feedback" ON ai_messages
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins see all conversations" ON ai_conversations;
CREATE POLICY "Admins see all conversations" ON ai_conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins see all messages" ON ai_messages;
CREATE POLICY "Admins see all messages" ON ai_messages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins manage exports" ON dataset_exports;
CREATE POLICY "Admins manage exports" ON dataset_exports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Index para performance
CREATE INDEX IF NOT EXISTS idx_ai_messages_training_status ON ai_messages(training_status);
CREATE INDEX IF NOT EXISTS idx_ai_messages_category ON ai_messages(category);
CREATE INDEX IF NOT EXISTS idx_ai_messages_user_id ON ai_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_created_at ON ai_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_thumbs ON ai_messages(user_thumbs_up);
CREATE INDEX IF NOT EXISTS idx_ai_messages_flagged ON ai_messages(user_flagged);
CREATE INDEX IF NOT EXISTS idx_ai_messages_lang ON ai_messages(user_message_lang);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
