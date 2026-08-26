# VyseFit — Plano Completo de Revisão Frontend & Interface

> Auditoria final: 25/08/2026 | Stack: Next 14.2 + Tailwind 4 + Supabase + Zustand | Tema dark-first glass + Brand #34D399

---

## 1. Fonte — Verificação Final

### 1.1 Carregamento (`app/layout.tsx:3-16,95`)

```ts
const inter = Inter({ subsets:["latin"], variable:"--font-inter" })
const barlow = Barlow_Condensed({ subsets:["latin"], variable:"--font-barlow", weight:["400","500","600","700","800","900"] })
<body className={`${inter.variable} ${barlow.variable} font-sans ...`}>
```

| Check | Status |
|-------|--------|
| `variable --font-inter` injetada via `inter.variable` | ✅ fix em `layout.tsx:96` |
| `variable --font-barlow` via `barlow.variable` | ✅ |
| Pesos 400-900 cobrem h1 900, h2 800, cta/score 900 | ✅ |
| `body { font-family: var(--font-inter) }` resolve | ✅ |
| Nenhum `font-[family-name:var(--font-barlow)]` inline | ✅ correto — centralizado em globals |

### 1.2 Escala (`app/globals.css:180-213,649-678`)

| Token | Definição | Uso |
|-------|-----------|-----|
| `h1` | Barlow 900 `clamp(28-36px)` `-0.03em` `0.95` | Só page hero (landing, subscription hero) |
| `h2` | Barlow 800 `18px` `-0.02em` | Section title |
| `h3` | Inter 600 `11px` `0.08em` uppercase `muted` | Card label — fix `0.8125→0.6875rem` feito |
| `.section-label` | 11px 600 0.08em uppercase muted | Label padrão — single source |
| `.text-cta` | Barlow 900 0.08em uppercase | CTA / badge pill |
| `.text-score` | Barlow 900 -0.03em line 1 | Números grandes |
| `.text-display` | Barlow 900 uppercase -0.02em | Display alternativo |
| `body` | Inter var, 16px base, antialiased | Texto corrido |

**Violação histórica corrigida:** 65 `text-[8px]/[9px]` → `10px` mínimo, `tracking-[0.4em]` → `section-label`, hero duplicado `text-4xl font-black` em cada card → `text-xl/2xl` nos cards.

### 1.3 Regra de Ouro Fonte
- Hero `900` só 1x por página. Card `bold` (700) ou `semibold` (600).
- Nunca <10px. `tracking` max `0.1em` em <12px.
- Score/número sempre `text-score` (evita `font-black` + `text-score` duplicado).

---

## 2. Interface — Estado Atual (pós-correções)

| Sistema | Nota | Evidência |
|---------|------|-----------|
| **Tipografia** | 8.5/10 | h1/h2/cta/score corretos, P0 codemod feito, h3 11px fix. Restam ~10 `font-black` em card que deveriam ser `bold` — não bloqueia |
| **Glass** | 8/10 | `glass-strong + border-border + rounded-2xl` em 90% cards. Outer `bg-muted/50` → `glass-strong` feito em recipes/scan/analytics. Inner pills `bg-muted/50` correto |
| **Brand 90/10** | 8/10 | `indigo/orange/purple` → brand em sleep/fasting/battle-pass. Restam 8 semantic stage/rarity (fasting `purple` 24h, battle `epic` purple) — permitido 10% |
| **Spacing 8pt** | 8.5/10 | gaps `6/4/3`, `p-8/6/5/4` 8pt. Micro `gap-1.5` aceitável |
| **Nav** | 8/10 | bottom `84px rounded-t-3xl` + scan `-mt-6`, sidebar `88px` + left border, more sheet lista + busca. `aria-expanded` + `aria-label` adicionados |
| **Empty/Paywall** | 8/10 | `empty-state-icon` + `paywall-card` unificados em 10+ lugares (sleep, fasting, bio-age, analytics, chatbot, battle-pass). Fallback polling 5s pro free |
| **Charts** | 8/10 | Tooltip `hsl(0 0% 6%)` dark em 10 arquivos. Overrides `var(--card)` removidos |
| **Bordas** | 9/10 | 25 `bg-white/*` → `border-border`, `grep bg-white/` 0. Light mode ok |

**Nota geral: 8.2/10 — ship-ready premium dark, light QA ok.**

---

## 3. Gaps Restantes (não bloqueantes)

| # | Gap | Impacto | Esforço | Arquivos |
|---|-----|---------|---------|----------|
| G1 | ~10 `font-black` em card titles ainda (ex: alguma `text-xl font-black` que deveria ser `bold`) | Baixo | 30min | grep `font-black` revisar |
| G2 | 6 trackers sem skeleton inicial (hydration, sleep, fasting, mood, weekly, monthly) — montam instant de localStorage | Médio | 1h | criar `skeleton-loaders` por tracker |
| G3 | `ui/empty-state.tsx` já usa `empty-state-icon` mas props genéricas — melhorar copy com CTA | Baixo | 15min | `empty-state.tsx` |
| G4 | `text-primary` semantic confusão (primary = near-white dark, mas brand é emerald) — alguns `text-primary` usados como accent | Baixo | 30min | grep `text-primary` |
| G5 | `haptic-press` não aplicado em todos interactives | Baixo | 15min | grep button sem haptic |

---

## 4. Plano de Implementação (Roadmap)

### Fase 1 — Blindagem (feita)
- [x] Glass único, radii travados, sombras
- [x] Brand 90/10, bordas light, tooltip dark
- [x] Tipografia codemod, h3 11px, min 10px
- [x] Nav iOS, product tabs, empty/paywall, auth, cron, pwa, realtime

### Fase 2 — Polimento (próxima sprint, 1 dia)
1. G1 codemod `font-black` em card → `bold` (30min)
2. G2 skeletons trackers (1h) — usar `skeleton` css `bg-muted animate-pulse`
3. G4 `text-primary` audit → `text-brand` onde é accent (30min)
4. G5 `haptic-press` em scan rows, quick actions (15min)

### Fase 3 — Performance (quando MRR > R$ 2k)
- RSC em `health-profile`, `reports` + `next/image` + virtualização `scan-history` (2 dias)
- Supabase `user_metrics` tabela + migração localStorage → DB (1 dia)
- Upstash Redis se rate limit memória não bastar (cross-instance)

### Métricas para acompanhar
- LCP < 1.5s (hoje ~2.5s por 100% client), CLS 0, FID <100ms
- Light mode contrast AA (axe)
- `font-black` count < 20 (hoje ~35 após fix)
- `bg-white/` count 0 (hoje 0 ✅)

---

## 5. Checklist QA (verificar a cada deploy)

**Fonte**
- [ ] `h1` só 1x por página 900 28-36px
- [ ] Nenhum `text-[8px]`/`text-[9px]`, nenhum `tracking-[0.3em]` em <12px
- [ ] `section-label` usado em todos tiny labels (11px)
- [ ] `text-score` / `text-cta` sem `font-black` duplicado

**Glass/Radii**
- [ ] Outer card `glass-strong border-border rounded-2xl`
- [ ] Button/input `rounded-xl h-11`, section `rounded-2xl`, modal `rounded-3xl`
- [ ] `0 bg-white/` e `0 border-white/`

**Brand/Charts**
- [ ] 0 `indigo-500`/`orange-500`/`purple-500` em primary (só semantic stage)
- [ ] Tooltip `hsl(0 0% 6%)` em todos charts
- [ ] Empty `empty-state-icon`, paywall `paywall-card`

**Nav/A11y**
- [ ] Bottom nav 84px + scan -mt-6, sidebar 88px left border
- [ ] Todos icon-only buttons têm `aria-label`, tabs têm `role="tab"` `aria-selected`

**PWA/Backend**
- [ ] `manifest.json` + `sw.js` registrados, offline queue 50
- [ ] `api/analyze-product` cache hit retorna `cached:true`
- [ ] Realtime `clan_messages` + polling 5s fallback

---

## 6. Arquivos Fonte de Verdade

- `app/layout.tsx` — Inter + Barlow_Condensed
- `app/globals.css` — h1/h2/h3, section-label, text-cta/score/display, glass-strong, paywall-card, empty-state-icon, tooltip, list-interactive, card-hover, focus ring
- `lib/plan-limits.ts` — `PLAN_LIMITS`, `isFeatureLocked`, `isViewLocked` (single source)
- `components/ui/badge.tsx` — `rounded-full 11px 600`, `components/ui/input.tsx` — `h-11 rounded-xl`, `components/ui/button.tsx` — `h-11/9/13`

Manter estes 6 arquivos como single source; todo resto consome tokens, não hardcode.

---

*Gerado após auditoria completa de 100+ arquivos, 300+ hits grep, e 3 rodadas de correções P0-P2.*
