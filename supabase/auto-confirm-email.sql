-- ═══════════════════════════════════════════════════════════════════════════
-- AUTO-CONFIRM EMAIL (para quando o Supabase insiste em pedir confirmação)
-- Execute este SQL no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Função para auto-confirmar usuários após criação
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o usuário como confirmado
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  -- Criar profile automaticamente
  INSERT INTO public.profiles (id, email, name, plan, country)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'free',
    COALESCE(NEW.raw_user_meta_data->>'country', 'BR')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
