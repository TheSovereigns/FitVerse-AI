# FitVerse AI — Plano de Implementação Completo

## Resumo
O app já tem 32 views, 116 componentes, 43 API routes e 3 sistemas de gamificação. Este plano foca em: **consolidar o que existe**, **conectar peças soltas**, e **adicionar features de alto impacto**.

---

## Fase 1 — Consolidar & Consertar (Semana 1-2)
> O que já existe mas não funciona ou não está conectado

### 1.1 Persistir dados dos trackers no Supabase
**Problema:** Sleep, Stress, Mood, Habits, Fasting, Hydration usam apenas localStorage. Se o usuário troca de dispositivo, perde tudo.

| Tracker | Ação |
|---------|------|
| Sleep | Criar tabela `sleep_logs`, migrar dados do localStorage, sincronizar |
| Stress | Criar tabela `stress_logs`, mesma abordagem |
| Mood | Criar tabela `mood_logs` |
| Habits | Criar tabela `habit_logs` com check-ins diários |
| Fasting | Criar tabela `fasting_sessions` |
| Hydration | Criar tabela `hydration_logs` |
| Body Tracker | Criar tabela `body_measurements` (já existe o componente, só falta a tabela) |

**Impacto:** Alto — dados do usuário nunca mais se perdem.

### 1.2 Conectar Achievement System às ações reais
**Problema:** 18 conquistas existem mas não disparam automaticamente.

- Escaneamento → checar conquistas de scan
- Treino completo → checar conquistas de workout
- Streak → checar conquistas de streak
- Check-in diário → checar conquistas de health

### 1.3 Conectar Boss Battles ao tracking automático
**Problema:** Dano é manual (usuário clica botões). Deveria ser automático.

- Escaneamento → 25 de dano
- Treino → 50 de dano
- Água → 15 de dano
- Hábito → 20 de dano

### 1.4 Conectar Reward Shop a recompensas reais
**Problema:** Itens comprados não desbloqueiam nada.

- Tema personalizado → aplicar na settings
- Trial estendido → adicionar dias ao plano
- Workouts extras → aumentar limite mensal
- Avatar customizado → salvar no profile

### 1.5 Body Tracker no navigation
**Problema:** Componente `body-tracker.tsx` existe mas não está em nenhuma view.

- Adicionar view `body` no page.tsx
- Adicionar ao sidebar desktop e mobile more sheet
- Conectar com tabela `body_measurements`

### 1.6 Predictive Analytics no navigation
**Problema:** Componente `predictive-analytics.tsx` existe mas não está em nenhuma view.

- Adicionar view `analytics` no page.tsx
- Mostrar previsão de peso, BMI, tendências

---

## Fase 2 — Features de Alto Impacto (Semana 3-4)
> O que mais melhora a qualidade de vida dos usuários

### 2.1 Diário de Refeições (Food Diary)
**O que:** Log manual de refeições além do scan.

- Criar tabela `food_logs` (meal_type, food_name, portion, macros, timestamp)
- View com timeline do dia: Café da manhã, Almoço, Jantar, Lanches
- Botão "+" para adicionar refeição manual
- Cálculo automático de macros diários
- Gráfico de distribuição de macros por refeição
- Sugestões de IA baseadas no que falta no dia

**Impacto:** Enorme — a maioria dos apps de nutrição tem isso como feature principal.

### 2.2 Water Tracker Avançado
**O que:** O home dashboard já tem um water tracker básico. Melhorar:

- Meta personalizada baseada em peso/clima
- Lembretes push a cada X horas
- Gráfico semanal de hidratação
- Conquistas de hidratação conectadas ao achievement system
- Badge "7 dias seguidos hidratado"

### 2.3 Relatório Mensal (Premium)
**O que:** Relatório completo do mês com:

- Evolução de peso e medidas
- Comparativo de macros (meta vs real)
- Top 5 alimentos escaneados
- Frequência de treinos
- Score de consistência (0-100)
- Previsão para o próximo mês
- PDF exportável

### 2.4 Lembretes Inteligentes
**O que:** Notificações contextuais baseadas nos dados do usuário.

- Hora de dormir (baseado no horário médio de sono)
- Hora de beber água
- Lembrete de treino (baseado na frequência)
- Check-in diário (estresse, humor)
- Jejum: hora de quebrar o jejum
- Motivação diária (frase personalizada)

### 2.5 Evolução Corporal Visual
**O que:** Comparação visual antes/depois.

- Upload de fotos com data
- Timeline visual de evolução
- Medidas corporais ao longo do tempo
- Gráficos de IMC, % gordura, circunferências
- Comparativo com metas

### 2.6 Social Feed (Além de Clans)
**O que:** Feed de atividades dos amigos/parceiros.

- Adicionar sistema de amigos/seguidores
- Feed com escaneamentos, treinos, conquistas dos amigos
- Curtir e comentar atividades
- Desafios entre amigos
- Ranking de amigos (weekly)

---

## Fase 3 — Inteligência Artificial (Semana 5-6)
> Tornar a IA mais inteligente e personalizada

### 3.1 AI Coach Personalizado
**O que:** Assistente de IA que aprende com os dados do usuário.

- Analisa padrões de sono + estresse + humor
- Sugere treinos baseados no nível de energia
- Ajusta macros baseado no progresso
- Identifica gatilhos de estresse
- Sugere horários ideais para treinar
- Weekly coaching call (resumo + dicas)

### 3.2 Análise de Foto de Corpo
**O que:** Estimar % de gordura e massa muscular por foto.

- Upload de foto frontal/lateral
- Estimativa de composição corporal
- Tracking de evolução visual
- Comparativo com fotos anteriores
- (Premium only)

### 3.3 Análise de Tendências
**O que:** IA identifica padrões nos dados.

- "Você dorme melhor quando treina de manhã"
- "Seu estresse aumenta nos fins de semana"
- "Seu score de longevidade subiu 12% este mês"
- Previsões: "Se manter esse ritmo, em 3 meses..."
- Alertas: "Detectamos uma queda no seu sono"

### 3.4 Meal Prep Inteligente
**O que:** Planejar refeições da semana automaticamente.

- IA gera plano semanal baseado em:
  - Preferências alimentares
  - Orçamento
  - Tempo disponível para cozinhar
  - Restrições alimentares
  - Metas nutricionais
- Lista de compras otimizada
- Receitas com passo a passo
- Tempo estimado de preparo

---

## Fase 4 — Gamificação Profunda (Semana 7-8)
> Engajamento através de competição e recompensas

### 4.1 Sistema de Ligas
**O que:** Ligas que sobem/descem baseado no desempenho.

- **Bronze → Prata → Ouro → Diamenda → Lendário**
- Top 20% sobem, bottom 20% descem
- Recompensas por subir de liga
- Rankings semanais
- Recompensas exclusivas por liga

### 4.2 Desafios Globais
**O que:** Desafios que todos os usuários participam.

- "Desafio de Janeiro: 30 dias de treino"
- "Maratona de Escaneamentos: 100 alimentos"
- "Desafio de Sono: 7 dias com 8h+"
- Leaderboard global
- Badges exclusivos por desafio

### 4.3 Batalhas de Clãs
**O que:** Clãs competem entre si.

- Clã A vs Clã B (semanal)
- Métricas: total de treinos, escaneamentos, streaks
- Recompensas para o clã vencedor
- Rankings de clãs
- Guerra de clãs (evento mensal)

### 4.4 Sistema de Conquistas Expandido
**O que:** Mais conquistas com recompensas reais.

- 50+ conquistas (era 18)
- Categorias: Nutrição, Treino, Saúde, Social, Exploração
- Conquistas secretas (easter eggs)
- Conquistas de coleção (completar sets)
- XP bônus por conquistas raras

---

## Fase 5 — Social & Comunidade (Semana 9-10)
> Tornar o app mais social e engajante

### 5.1 Sistema de Amigos
**O que:** Adicionar amigos e ver atividades.

- Buscar por email/nome
- Solicitação de amizade
- Lista de amigos com status online
- Ver treinos e escaneamentos dos amigos
- Enviar motivação/elogios

### 5.2 Grupos de Estudo
**O que:** Grupos focados em temas específicos.

- "Grupo Keto" - trocar receitas e dicas
- "Grupo Corredores" - treinos de corrida
- "Grupo Veganos" - alternativas veganas
- Discussões por tema
- Compartilhar receitas e treinos

### 5.3 Marketplace de Receitas
**O que:** Usuários compartilham receitas.

- Upload de receitas com fotos
- Avaliação e comentários
- Filtros por dieta, calorias, tempo
- Receitas mais populares
- Desafios de culinária

### 5.4 Live Sessions
**O que:** Treinos ao vivo com outros usuários.

- Horários agendados
- Treino guiado por IA ou instrutor
- Chat ao vivo durante o treino
- Contador de participantes
- Replay disponível

---

## Fase 6 — Integrações & Exportação (Semana 11-12)
> Conectar com o ecossistema externo

### 6.1 Integração com Wearables
**O que:** Sincronizar com dispositivos de saúde.

- **Apple Health:** Sono, passos, calorias, frequência cardíaca
- **Google Fit:** Mesmos dados
- **Fitbit:** Sono, atividade, peso
- **Garmin:** Dados de treino avançados
- Sincronização automática diária

### 6.2 Exportação de Dados
**O que:** Exportar dados em formatos úteis.

- **CSV:** Todos os dados do usuário
- **PDF:** Relatórios (semanal, mensal)
- **Apple Health Kit:** Exportar para o Health
- **Google Fit API:** Exportar para o Fit
- **API própria:** Para desenvolvedores

### 6.3 Integração com Smart Scales
**O que:** Conectar com balanças inteligentes.

- **Xiaomi Mi Scale:** Peso, % gordura, massa muscular
- **Withings:** Peso, IMC, % gordura
- **Renpho:** Dados corporais completos
- Sync automático ao pesar

### 6.4 Integração com Mercados/Farmácias
**O que:** Escanear produtos diretamente na loja.

- Câmera do mercado → identifica produto
- Compara com opções mais saudáveis
- Mostra preço medio
- Lista de alternativas próximas

---

## Fase 7 — Monetização Avançada (Semana 13-14)
> Maximizar receita sem prejudicar experiência

### 7.1 Planos Family
**O que:** Planos para famílias.

- Até 5 membros
- Preço com desconto
- Dashboard familiar
- Metas compartilhadas
- Receitas para a família

### 7.2 Planos Enterprise
**O que:** Planos para empresas/academias.

- Dashboard para RH
- Relatórios de saúde dos funcionários
- Desafios corporativos
- Integração com sistemas de RH
- Preço por funcionário

### 7.3 Merchandise & Produtos
**O que:** Vender produtos físicos.

- Shaker FitVerse
- Suplementos propriedade
- Livro de receitas
- Programa de treinos impresso
- Parceiros afiliados

### 7.4 Consultoria com Nutricionistas
**O que:** Conectar com profissionais.

- Agendamento de consultas
- Plano alimentar profissional
- Acompanhamento semanal
- Acesso ao app do profissional
- Chat com nutricionista

---

## Fase 8 — Performance & Escala (Semana 15-16)
> Preparar para milhões de usuários

### 8.1 Cache & Otimização
- Redis cache para dados frequentes
- CDN para imagens
- Code splitting otimizado
- Prefetching de rotas
- Service worker para offline

### 8.2 Monitoramento
- Sentry para erros em produção
- Analytics de performance
- Uptime monitoring
- Alertas de sistema
- Dashboard de métricas

### 8.3 Segurança
- Rate limiting avançado
- Detecção de fraude
- Auditoria de acessos
- Compliance LGPD/GDPR
- Criptografia de dados sensíveis

### 8.4 A/B Testing
- Testar layouts diferentes
- Testar fluxos de onboarding
- Testar preços
- Testar features
- Analytics de conversão

---

## Priorização (ROI)

| Prioridade | Feature | Impacto | Esforço | ROI |
|------------|---------|---------|---------|-----|
| 🔴 P0 | Food Diary | ⭐⭐⭐⭐⭐ | Médio | Excelente |
| 🔴 P0 | Persistir trackers no Supabase | ⭐⭐⭐⭐⭐ | Médio | Excelente |
| 🔴 P0 | Conectar achievements/battles | ⭐⭐⭐⭐ | Baixo | Excelente |
| 🟡 P1 | Lembretes inteligentes | ⭐⭐⭐⭐ | Baixo | Muito Bom |
| 🟡 P1 | Evolução corporal visual | ⭐⭐⭐⭐ | Médio | Muito Bom |
| 🟡 P1 | Water tracker avançado | ⭐⭐⭐ | Baixo | Bom |
| 🟡 P1 | AI Coach personalizado | ⭐⭐⭐⭐⭐ | Alto | Muito Bom |
| 🟢 P2 | Sistema de ligas | ⭐⭐⭐⭐ | Médio | Bom |
| 🟢 P2 | Desafios globais | ⭐⭐⭐ | Médio | Bom |
| 🟢 P2 | Sistema de amigos | ⭐⭐⭐⭐ | Alto | Bom |
| 🟢 P2 | Integração wearables | ⭐⭐⭐⭐ | Alto | Bom |
| 🔵 P3 | Live Sessions | ⭐⭐⭐ | Alto | Médio |
| 🔵 P3 | Planos Family/Enterprise | ⭐⭐⭐ | Médio | Bom |
| 🔵 P3 | Marketplace de receitas | ⭐⭐⭐ | Alto | Médio |
| ⚪ P4 | Smart Scales integration | ⭐⭐ | Alto | Baixo |
| ⚪ P4 | Merchandise | ⭐⭐ | Médio | Baixo |

---

## Recomendação: Começar por

1. **Food Diary** — Feature mais pedida em apps de nutrição, preenche a lacuna principal
2. **Persistir trackers** — Dados do usuário nunca mais se perdem
3. **Conectar gamificação** — O sistema já existe, só precisa ser ativado
4. **Lembretes** — Engajamento passivo, alta retenção
5. **Evolução corporal** — Visual e motivacional

**Estimativa total:** 16 semanas para implementar tudo, com equipe de 2-3 devs.
**MVP recomendado:** Fases 1 + 2 (4 semanas) para lançar versão consolidada.
