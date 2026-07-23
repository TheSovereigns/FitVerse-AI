# FitVerse AI - Plano de Implementação Completo

## Estado Atual: ~75% Completo

---

## FASE 0 - Corrigir Segurança (URGENTE)
**Prioridade: P0 | Tempo estimado: 2-3h**

### 0.1 Proteger rotas de API públicas
- [ ] `middleware.ts` - Mover AI endpoints de `publicRoutes` para `protectedRoutes`:
  - `/api/generate-metabolic-plan`
  - `/api/generate-initial-plan`
  - `/api/generate-weekly-meals`
  - `/api/recommend-supplements`
  - `/api/analyze-sleep`
  - `/api/biological-age`
  - `/api/food-substitutions`
  - `/api/weekly-report`
  - `/api/generate-workouts`
  - `/api/generate-recipes`
  - `/api/calculate-macros`
- [ ] Adicionar auth check em cada route handler como defesa em profundidade

### 0.2 Rate limiting em todas as rotas AI
- [ ] Aplicar `RATE_LIMITS.generate` em: generate-workouts, generate-recipes, calculate-macros, recommend-supplements, biological-age, food-substitutions, generate-metabolic-plan, generate-initial-plan, generate-weekly-meals, analyze-sleep, weekly-report

### 0.3 Validação de input com Zod
- [ ] Criar schemas Zod para cada rota POST
- [ ] Validar body em cada route handler

---

## FASE 1 - Persistência Server-Side (CRÍTICO)
**Prioridade: P0 | Tempo estimado: 8-12h**

### 1.1 Criar tabelas no Supabase
```sql
-- Tabelas necessárias
user_health_data (user_id, type, data, created_at)
-- type: 'sleep' | 'stress' | 'mood' | 'fasting' | 'checkin' | 'meditation'
-- data: JSONB com os campos específicos

user_habits (user_id, habit_name, completed_dates[], streak, created_at)
user_body_measurements (user_id, weight, body_fat, muscle_mass, measurements JSONB, photo_url, created_at)
user_dietary_restrictions (user_id, restrictions JSONB, updated_at)
weekly_snapshots (user_id, week_start, scans, workouts, recipes, avg_score, created_at)
```

### 1.2 Migrar hooks localStorage → Supabase
- [ ] `useStreak.ts` → usar tabela `scans` + `workouts` + `recipes` para calcular streak real
- [ ] `useWeeklyReport.ts` → usar `weekly_snapshots` para tendências reais
- [ ] `sleep-tracker.tsx` → sync com `user_health_data`
- [ ] `stress-tracker.tsx` → sync com `user_health_data`
- [ ] `health-checkin.tsx` → sync com `user_health_data`
- [ ] `mood-tracker.tsx` → sync com `user_health_data`
- [ ] `fasting-tracker.tsx` → sync com `user_health_data`
- [ ] `habit-builder.tsx` → sync com `user_habits`
- [ ] `body-tracker.tsx` → sync com `user_body_measurements`
- [ ] `dietary-restrictions.tsx` → sync com `user_dietary_restrictions`

### 1.3 Criar hooks de sync
- [ ] `useServerSync.ts` - Hook genérico para sync localStorage ↔ Supabase
- [ ] Persistir dados no servidor, cache local para offline

---

## FASE 2 - Corrigir Features Quebradas
**Prioridade: P1 | Tempo estimado: 6-8h**

### 2.1 Wearable Integrations (reais)
- [ ] `wearable-integrations.tsx` → Integrar Google Fit REST API
  - OAuth flow para Google Fit
  - Sync passos, peso, sono
  - Endpoint `/api/integrations/google-fit`

### 2.2 Weekly Report com dados reais
- [ ] `useWeeklyReport.ts` → Calcular tendências de semanas anteriores
  - Usar `weekly_snapshots` para comparar
  - Gráficos de progresso reais

### 2.3 Database Types atualizado
- [ ] Regenerar `database.types.ts` com todas as tabelas
- [ ] Incluir: clans, clan_members, clan_messages, challenges, etc.

### 2.4 Supabase SQL consolidado
- [ ] Criar `supabase/migrations/001_initial.sql` com todo o schema
- [ ] Remover arquivos SQL duplicados

---

## FASE 3 - UI/UX Completo
**Prioridade: P1 | Tempo estimado: 4-6h**

### 3.1 Internacionalização completa
- [ ] `app/error.tsx` → Usar `useTranslation()`
- [ ] `app/not-found.tsx` → Usar `useTranslation()`
- [ ] `app/offline.tsx` → Usar `useTranslation()`

### 3.2 Skeleton loaders por view
- [ ] Criar skeletons específicos para cada lazy view:
  - `home-skeleton.tsx`
  - `training-skeleton.tsx`
  - `recipes-skeleton.tsx`
  - `chat-skeleton.tsx`
  - etc.

### 3.3 Ad Banner funcional
- [ ] Integrar Google AdSense (web) ou AdMob (Capacitor)
- [ ] ou remover features de ads se não monetizar

### 3.4 PWA / Offline Mode
- [ ] Adicionar `next-pwa` ou `serwist`
- [ ] Cache de API responses
- [ ] Queue de requests offline

---

## FASE 4 - Gamificação Completa
**Prioridade: P2 | Tempo estimado: 6-8h**

### 4.1 Tabelas de gamificação
```sql
user_xp (user_id, total_xp, level, created_at)
user_badges (user_id, badge_id, earned_at)
user_achievements (user_id, achievement_id, progress, completed_at)
season_progress (user_id, season_id, xp_earned, rank)
boss_progress (user_id, boss_id, damage_dealt, defeated_at)
reward_inventory (user_id, reward_id, purchased_at)
```

### 4.2 Migrar gamificação localStorage → Supabase
- [ ] `season-system.tsx` → sync com `season_progress`
- [ ] `boss-battles.tsx` → sync com `boss_progress`
- [ ] `reward-shop.tsx` → sync com `reward_inventory`
- [ ] `gamification.tsx` → sync com `user_xp`, `user_badges`

### 4.3 Sistema de conquistas
- [ ] Definir 50+ conquistas
- [ ] Progress tracking server-side
- [ ] Notificações quando desbloqueia

---

## FASE 5 - Social Features
**Prioridade: P2 | Tempo estimado: 4-6h**

### 5.1 Compartilhamento
- [ ] Share to Instagram Stories com imagem customizada
- [ ] Share to Twitter/X com preview card
- [ ] Share to WhatsApp com imagem de progresso
- [ ] Endpoint `/api/share/image` para gerar imagem OG

### 5.2 Leaderboards
- [ ] Global leaderboard (top usuários por XP)
- [ ] Clan leaderboard
- [ ] Weekly leaderboard

### 5.3 Feed social
- [ ] Activity feed público (opt-in)
- [ ] Comentar curtir atividades de outros
- [ ] Seguir usuários

---

## FASE 6 - Notificações
**Prioridade: P2 | Tempo estimado: 4-6h**

### 6.1 Push Notifications
- [ ] Web Push API com VAPID keys
- [ ] Supabase Edge Function para enviar
- [ ] Tipos: lembrete de treino, conquista desbloqueada, mensagem de clan

### 6.2 Email Notifications
- [ ] Weekly digest por email
- [ ] Supabase Edge Function + Resend/SendGrid
- [ ] Preferences no settings

---

## FASE 7 - Performance
**Prioridade: P3 | Tempo estimado: 3-4h**

### 7.1 Substituir polling por Realtime
- [ ] `usePlanLimits.tsx` → Supabase Realtime em vez de polling 30s
- [ ] `useStreak.ts` → Supabase Realtime em vez de polling 5s

### 7.2 Otimização de bundles
- [ ] Agrupar componentes relacionados em shared chunks
- [ ] Usar `next/dynamic` com `loading` personalizado

### 7.3 Imagens
- [ ] Usar `next/image` para imagens de produto
- [ ] Lazy loading de imagens
- [ ] WebP/AVIF conversion

---

## FASE 8 - Testes
**Prioridade: P3 | Tempo estimado: 4-6h**

### 8.1 Testes de API
- [ ] Testar cada rota com autenticação
- [ ] Testar rate limiting
- [ ] Testar validação de input

### 8.2 Testes de componente
- [ ] Testar fluxo de autenticação
- [ ] Testar scan de produto
- [ ] Testar geração de receitas/treinos

### 8.3 Testes de integração
- [ ] Testar fluxo completo: signup → scan → resultado
- [ ] Testar fluxo de pagamento: checkout → webhook → upgrade

---

## Resumo por Fase

| Fase | Descrição | Tempo | Impacto |
|------|-----------|-------|---------|
| 0 | Segurança | 2-3h | Crítico |
| 1 | Persistência | 8-12h | Crítico |
| 2 | Features quebradas | 6-8h | Alto |
| 3 | UI/UX | 4-6h | Alto |
| 4 | Gamificação | 6-8h | Médio |
| 5 | Social | 4-6h | Médio |
| 6 | Notificações | 4-6h | Médio |
| 7 | Performance | 3-4h | Baixo |
| 8 | Testes | 4-6h | Baixo |
| **Total** | | **41-59h** | |

---

## Orde de Execução Recomendada

1. **Fase 0** (agora) - Segurança primeiro
2. **Fase 1** (agora) - Dados no servidor
3. **Fase 2** (próximo) - Corrigir o que está quebrado
4. **Fase 3** (depois) - Polish UI/UX
5. **Fases 4-8** (conforme tempo disponível)
