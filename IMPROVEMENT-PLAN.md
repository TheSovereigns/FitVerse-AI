# FitVerse AI — Plano de Implementacao & Melhorias

## Estado Atual
- 151 componentes (45 sao dead code)
- 40+ views funcionando
- 43 API routes
- Sistema de gamification funcionando (XP, coins, battle pass, achievements)
- Todos os dados em localStorage (nenhum Supabase para trackers)

---

## Fase 1 — Limpar & Organizar (Prioridade Alta)

### 1.1 Deletar Dead Code (45 arquivos)
Remover componentes que nao sao usados em lugar nenhum:
- `achievement-system.tsx` (substituido por `achievements-page.tsx`)
- `admin-dashboard.tsx` (substituido por `app/admin-dashboard/`)
- `AdminGuard.tsx`, `admob-banner.tsx`, `google-ad.tsx`
- `alternative-products.tsx`, `bioscan-results.tsx`
- `calendar-view.tsx`, `dynamic-island.tsx`
- `gamification.tsx` (substituido por `lib/gamification.ts`)
- `gdpr-panel.tsx`, `DataExportImport.tsx`
- `hero-section.tsx`, `benefits-section.tsx`, `footer-cta-section.tsx`, `how-it-works-section.tsx`, `social-proof-section.tsx`, `trust-badges-section.tsx` (landing page abandonada)
- `liquid-launchpad.tsx`, `liquid-universe.tsx`
- `macro-detail-modal.tsx`, `meal-plate.tsx`
- `onboarding-card.tsx` (substituido por `onboarding-flow.tsx`)
- `OverviewChart.tsx` (substituido por `analytics-charts.tsx`)
- `predictive-analytics.tsx`, `plans-view.tsx`
- `profile-setup.tsx`, `ProfileForm.tsx` (substituido por `health-profile.tsx`)
- `progress-circle.tsx`, `recipes-section.tsx`
- `RevenueChart.tsx` (substituido por `admin/growth-chart.tsx`)
- `scan-modal.tsx`, `ScanButton.tsx`
- `SearchBar.tsx`, `share-card.tsx`
- `store-tab.tsx`, `theme-customizer.tsx`
- `user-profile.tsx` (substituido por `health-profile.tsx`)
- `voice-coach.tsx`, `wearable-integrations.tsx`
- `weekly-challenges.tsx`, `cta-button.tsx`, `floating-cta-mobile.tsx`
- `admin/users-table.tsx`, `chat/message-feedback.tsx`

**Impacto:** Remove ~30% do bundle, facilita manutencao.

### 1.2 Migrar trackers para Supabase
Atualmente Sleep, Stress, Mood, Habits, Fasting, Hydration usam apenas localStorage.

| Tabela | Dados |
|--------|-------|
| `sleep_logs` | date, hours, quality, notes |
| `stress_logs` | date, level (1-5), notes |
| `mood_logs` | date, mood (1-5), notes |
| `habit_logs` | date, completed[] |
| `fasting_sessions` | start, end, type |
| `hydration_logs` | date, amount, goal |
| `body_measurements` | date, weight, chest, waist, hips, arms, thighs |
| `food_logs` | date, meal_type, food_name, macros |

**Impacto:** Dados do usuario nunca mais se perdem ao trocar de dispositivo.

### 1.3 Melhorar Home Dashboard
O dashboard principal e o que o usuario mais ve. Melhorias:
- **Grafico de progresso semanal** (mini bar chart de atividade)
- **Streak visual** (calendario de 7 dias com cores)
- **Meta diaria de agua** com barra de progresso
- **Ultimo scan** com score e foto
- **Treino do dia** (se tiver plano gerado)
- **Motivacao diaria** (frase aleatoria do chatbot)

---

## Fase 2 — Features de Alto Impacto (Prioridade Alta)

### 2.1 Water Tracker Avancado
O tracker de agua atual e basico. Melhorar:
- Meta personalizada baseada em peso (2.5-3.5L)
- Grafico semanal de hidratacao
- Lembretes a cada 2 horas
- Conquista "7 dias seguidos hidratado"
- Historico de 30 dias com grafico

### 2.2 Sistema de Lembretes
Notificacoes contextuais baseadas nos dados do usuario:
- Hora de dormir (baseado no horario medio de sono)
- Hora de beber agua (a cada 2h)
- Lembrete de treino (baseado na frequencia)
- Check-in diario (estresse, humor)
- Jejum: hora de quebrar o jejum
- Motivacao diaria

### 2.3 Relatorio Mensal
Resumo completo do mes com:
- Evolucao de peso e medidas
- Comparativo de macros (meta vs real)
- Top alimentos escaneados
- Frequencia de treinos
- Score de consistencia (0-100)
- Exportavel em JSON

### 2.4 Onboarding Melhorado
O onboarding atual e basico. Melhorias:
- Quiz de objetivos (perder peso, ganhar massa, manter saude)
- Selecao de restricoes alimentares
- Configuracao de metas de agua
- Definicao de frequencia de treinos
- Tutorial interativo do app

---

## Fase 3 — Qualidade & UX (Prioridade Media)

### 3.1 Melhorar Scanning
- Historico de scans com busca
- Favoritar alimentos
- Comparar dois alimentos lado a lado
- Sugestoes baseadas no historico
- Score de saude mais detalhado

### 3.2 Treinos Melhorados
- Animacoes dos exercicios
- Timer de descanso entre series
- Historico de treinos completados
- Progressao de carga (aumentar peso/reps ao longo do tempo)
- Treinos salvos pelo usuario

### 3.3 Receitas IA
- Salvar receitas favoritas
- Lista de compras automatica
- Adjustar porcoes
- Substituir ingredientes
- Tempo de preparo estimado

### 3.4 Perfil de Saude
- Timeline de evolução do usuario
- Grafico de IMC ao longo do tempo
- Comparativo com metas
- badges de conquista no perfil
- Foto de perfil

---

## Fase 4 — Performance & Estabilidade (Prioridade Media)

### 4.1 Performance
- Memoizar componentes pesados (charts, listas)
- Virtualizar listas longas (historico de scans)
- Lazy load de imagens
- Reduzir bundle size (deletar dead code)
- Service worker para caching offline

### 4.2 Error Handling
- Error boundaries por view
- Toast de erro mais descritivo
- Fallback para dados corrompidos
- Retry automatico em erros de rede

### 4.3 Testes
- Testes unitarios para `lib/gamification.ts`
- Testes unitarios para `lib/plan-limits.ts`
- Testes de integracao para hooks principais
- Testes E2E para fluxo de scan

---

## Fase 5 — Features Futuras (Prioridade Baixa)

### 5.1 Social
- Feed de atividades dos amigos
- Desafios entre amigos
- Compartilhar conquistas
- Ranking semanal

### 5.2 Integracao com Wearables
- Sincronizar com Apple Health
- Sincronizar com Google Fit
- Importar dados de smartwatch

### 5.3 IA Avancada
- Chatbot com memoria de conversas
- Sugestoes personalizadas baseadas no historico
- Previsao de peso
- Analise de tendencias

---

## Ordem de Execucao Recomendada

1. **Deletar dead code** (1-2 horas)
2. **Melhorar Home Dashboard** (4-6 horas)
3. **Water Tracker avancado** (3-4 horas)
4. **Migrar trackers para Supabase** (6-8 horas)
5. **Sistema de lembretes** (4-6 horas)
6. **Relatorio mensal** (4-6 horas)
7. **Melhorar scanning** (3-4 horas)
8. **Melhorar treinos** (4-6 horas)
9. **Performance** (2-3 horas)
10. **Testes** (4-6 horas)

---

## Notas Importantes

- **Supabase:** O usuario nao vai pagar inicialmente. Manter tudo em localStorage por enquanto, mas deixar pronto para migração futura.
- **Plano Free/Pro/Premium:** Manter feature gating, mas o Battle Pass e todas as features de progresso sao free.
- **i18n:** Todas as novas features precisam de suporte PT/EN.
- **Mobile-first:** Todas as features precisam funcionar bem no mobile.
