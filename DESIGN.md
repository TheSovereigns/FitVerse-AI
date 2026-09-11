# VyseFit Design System

> Stack: Next.js 14.2 + Tailwind CSS 4 + Supabase + Zustand | Dark-first glass morphism | Brand `#34D399` emerald | Fonts Inter + Barlow Condensed | Generated 2026-08-26

This document describes exactly how the entire site's design, buttons, cards, navigation, and pages are built, with `file:line` references to the source.

---

## 1. Overview

- **Theme:** Dark-first, glass morphism, minimal CalAI/FitCal inspiration. Light mode supported via CSS variables.
- **Brand:** Single accent `#34D399` (emerald) via `--brand`. Dynamic via `app/layout.tsx:69-89` (`fitverse-accent` localStorage → `--brand`, `--brand-muted`, `--brand-hover`, `--ring`).
- **Fonts:** `Inter` (body, `h3-h6`) + `Barlow_Condensed` (display, `h1-h2`) via `app/layout.tsx:11-16` (`variable --font-inter` + `--font-barlow`, `display:swap`, `preload:true`, weights `Inter 400/600/700`, `Barlow 600/700/900`).
- **Layout:** `app/app/page.tsx:412` `md:ml-[88px] max-w-[1200px] mx-auto`, pages `max-w-2xl` (profile/food) / `max-w-4xl` (home) / `max-w-6xl` (landing) / `max-w-7xl` (subscription). Sections `space-y-4/6`, `gap-6`, safe-area `pb-nav` (88px) `app/globals.css:377`.

---

## 2. Tokens — `app/globals.css:12-144`

### 2.1 Colors

| Token | Light (`:root:12`) | Dark (`.dark:56`) | Usage |
|-------|-------------------|------------------|-------|
| `--background` | `#F5F5F7` | `#0A0A0A` | `body` bg `globals.css:162` |
| `--foreground` | `#1A1A1A` | `#F5F5F7` | primary text |
| `--card` | `rgba(255,255,255,0.82)` | `rgba(255,255,255,0.06)` | `glass`, `Card` |
| `--popover` | `rgba(255,255,255,0.9)` | `rgba(28,28,30,0.95)` | dialogs, sheets |
| `--primary` | `#1A1A1A` | `#F5F5F7` | default Button bg |
| `--secondary` | `#EDEDEF` | `rgba(255,255,255,0.06)` | secondary Button |
| `--muted` | `#EDEDEF` | `rgba(255,255,255,0.06)` | input bg, hover |
| `--muted-foreground` | `#8E8E93` | `#636366` | `h3`, `.section-label` |
| `--brand` | `#34D399` | `#34D399` | accent, ring, charts |
| `--brand-muted` | `10%` | `12%` | pill, icon bg |
| `--brand-hover` | `16%` | `20%` | hover |
| `--border` | `0,0,0,0.06` | `255,255,255,0.08` | `* { @apply border-border }` |
| `--ring` | `#34D399` | `#34D399` | focus |
| `--chart-1..5` | `#34D399,#30D158,#8E8E93,#636366,#FF453A` | same | Recharts |

All mapped to `--color-*` in `@theme:99`.

### 2.2 Radii — Locked System

`--radius: 1rem (16px)` → `sm 12px, md 14px, lg 16px, xl 20px` `globals.css:131-135`.

| Element | Class | Size | Example |
|---------|-------|------|---------|
| Button / Input | `rounded-xl` | 12px | `components/ui/button.tsx:7`, `input.tsx:9` |
| Card / Section | `rounded-2xl` | 16px | `components/ui/card.tsx:5`, `glass-card:564` |
| Modal / Sheet | `rounded-3xl` | 24px | `dialog.tsx:63` (`[2.5rem]` premium), `mobile-more-sheet:151` |

### 2.3 Shadows

- Glass light: `0 1px 3px 0.04, 0 8px 24px 0.03` (`glass:247`); dark: `0 8px 32px 0.36` (`glass:267`)
- Card hover: `0 8px 32px 0.08 + border brand 15%` (`card-hover:363`)
- Button: `shadow-sm` (default), `shadow-lg shadow-brand/20` (brand CTA `landing:73`)

### 2.4 Glass — Single Material `globals.css:238-288`

| Class | Light | Dark | Blur | Use |
|-------|-------|------|------|-----|
| `.glass` | `rgba(255,255,255,0.72)` | `rgba(28,28,30,0.62)` | `28px saturate 180%` | filters |
| `.glass-strong` | `0.85` | `0.62` | same | **primary card** (>80 uses: `home-dashboard:243`, `sleep-tracker:124`) |
| `.glass-subtle` | `0.5 blur 16px` | `0.03` | 16px | TabsList, landing nav |
| `.glass-card` | `var(--card)` | `0.62` | 28px | `home-dashboard:423` quick actions |
| `.paywall-card:687` | `1rem, rgba(28,28,30,0.62) blur 28px, p-6` | — | — | paywall |
| `.empty-state-icon:709` | `64px rounded-2xl bg brand 10% border 15%` | — | — | empty |

Chrome: `bg-card/80 blur-2xl border-r` (`desktop-sidebar:200`), `bg-popover/95` flyout, `bg-background/80` header.

### 2.5 Spacing & Safe Area

- Containers: `max-w-4xl` home, `3xl` product, `2xl` health/food, `1200` shell, `6xl` landing, `7xl` subscription.
- Gaps: `space-y-6`, `gap-6`, card `p-5/6/8` (`globals.css:377`).
- Safe: `.pt-safe-top`, `.pb-safe`, `.pb-nav (88px)`, `.mobile-fab-safe bottom: calc(safe+5.5rem)`; mobile `button min-height 44px` `globals.css:398`.

---

## 3. Typography — `app/layout.tsx:11` + `globals.css:162-684`

### 3.1 Fonts
```ts
Inter      variable --font-inter  (body, h3-h6, 400/600/700, swap, preload)
Barlow_Condensed variable --font-barlow (display, h1-h2, 600/700/900, swap)
```
`body: var(--font-inter), -apple-system, ...` + `font-feature-settings "rlig" "calt"` + `antialiased` `globals.css:162`. `html 16px` (15px mobile/xl).

### 3.2 Scale
| Element | Family | Weight | Size | Tracking | Usage |
|---------|--------|--------|------|----------|-------|
| `h1` | Barlow | 900 | `clamp(1.75rem,5vw,2.25rem)` | `-0.03em` | page hero only |
| `h2` | Barlow | 800 | `1.125rem` | `-0.02em` | section title |
| `h3` | Inter | 600 | `0.6875rem` (11px) | `0.08em` uppercase muted | card label |
| `.section-label:302` | Inter | 600 | `11px` | `0.08em` uppercase muted | canonical label |
| `.text-cta:650` | Barlow | 900 | `0.08em` uppercase | — | billing, pricing CTA |
| `.text-score:658` | Barlow | 900 | `-0.03em` `line-height 1` | — | big numbers |
| `.text-display:666` | Barlow | 900 | `-0.02em` uppercase | — | display alt |
| `.text-hero:411` | Barlow | — | `clamp(2rem,6vw,4rem)` | — | landing hero |

Helpers: `.macro-protein #34D399` etc:579, `.gradient-brand 135deg #34D399→#10B981`:422.

---

## 4. Buttons — `components/ui/button.tsx:6-32` + `globals.css:311`

### 4.1 Primitive
```ts
base: "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 [&_svg]:size-5 haptic-press focus-visible:ring-2 ring-primary/30"
```

| Variant | Classes | Visual |
|---------|---------|--------|
| `default` | `bg-primary text-primary-foreground shadow-sm hover:opacity-90` | primary (theme-aware black/white) |
| `destructive` | `bg-destructive text-destructive-foreground shadow-sm` | red |
| `outline` | `border border-border bg-transparent hover:bg-muted` | ghost border |
| `secondary` | `bg-muted hover:bg-muted/80` | muted fill |
| `ghost` | `hover:bg-muted` | icon/text only |
| `link` | `underline-offset-4 hover:underline` | link |

| Size | Class |
|------|-------|
| `default` | `h-11 px-6` |
| `sm` | `h-9 px-4 text-xs` |
| `lg` | `h-13 px-8` |
| `icon` | `h-11 w-11` |

Global: `rounded-xl 12px`, `haptic-press:active scale 0.97 opacity 0.88` `globals.css:311`, `focus-visible outline 2px solid var(--brand)` `globals.css:232`, mobile `min-height 44px`.

No `brand` variant in primitive — brand is ad-hoc `bg-brand text-brand-foreground hover:bg-brand/90` (or `text-white`).

### 4.2 Brand Patterns (ad-hoc)
- **Primary CTA:** `w-full h-11 rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-semibold text-xs` (health-profile paywall, trackers)
- **Hero CTA:** `h-12 text-base font-black bg-brand rounded-xl shadow-lg shadow-brand/25 hover:scale-[1.02] active:scale-[0.98]` (`auth/signup:559`, `login:211`)
- **Ghost discard:** `h-10 px-4 rounded-xl border border-border text-muted-foreground hover:text-foreground` (`app/app/page.tsx:527`)
- **Icon-only:** `w-9 h-9 rounded-xl text-muted-foreground hover:bg-muted` (header admin/profile `app/app/page.tsx:430`), `w-14 h-14 rounded-2xl bg-card border` (product `product-result:292`)

### 4.3 Usage Across Site

| Area | Example `file:line` | Pattern |
|------|---------------------|---------|
| Auth | `login:211` submit `h-12 brand shadow`, `login:239` Google `h-12 bg-card border`, `login:184` eye `ghost sm` | split-screen `glass-strong rounded-3xl p-6` |
| Landing | `landing:73` Sign Up `brand px-5 py-2.5 text-cta`, `landing:110` Get Started `brand px-8 py-4 rounded-2xl shine` | `landing:132` feature `glass-strong card-hover` |
| Home | `home:308` ghost `h-9 w-full group-arrow`, `home:379` sm `h-9` Start, `home:419` quick `glass-card p-5 haptic-press` | `home:243` quote `glass-strong p-4` |
| Profile | `health-profile:424` save `icon h-11 brand`, `health-profile:668` Upgrade `h-11 w-full` brand/amber | `health-profile:373` `glass-strong` + top gradient strip |
| Product | `product:292` back `w-14 h-14 card`, `product:352` tabs `muted/50` | `product:316` `glass-strong p-5` identity |
| Subscription | `subscription:486` Switch `h-11 tracking 0.08em` | `subscription:430` `rounded-2xl border backdrop-blur p-5` |
| Trackers | `sleep:147` Unlock `h-11 brand w-full` | `sleep:124` `glass-strong p-5` + `paywall-card` |

---

## 5. Cards — `components/ui/card.tsx:5` + `globals.css:560`

**Base primitive:**
```tsx
Card: "bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border border-border py-5 shadow-sm"
Header: "grid auto-rows-min gap-2 px-6"  Content: "px-6"  Footer: "px-6"
```

**Glass system (dominant, >80 uses):**
```html
<div class="rounded-2xl glass-strong border border-border p-5 md:p-6">
```
Examples: `home:260` hero `p-8`, `sleep:159` `p-5`, `health-profile:373` header, `product:316` identity.

Modifiers: `hover-lift translateY -1px`, `card-hover translateY -2px shadow brand 15%`, `list-interactive translateX 2px` (`globals.css:326`).

**Interior anatomy (consistent):**
```tsx
<div class="flex items-center gap-2.5">
  <div class="flex h-9 w-9 rounded-xl bg-brand-muted"><Icon class="h-4 w-4 text-brand" /></div>
  <div><h3 class="text-sm font-semibold">Title</h3><p class="text-xs muted">Subtitle</p></div>
</div>
```
Stats grid: `grid 3 gap-2 p-2 rounded-xl bg-brand-muted` (`sleep:194`). `Progress h-2 bg-primary/20 rounded-full` (`progress.tsx:21`).

Empty/Paywall inside same shell: `paywall-card` + `paywall-icon 48px` + `h3 15px` + `Button h-11 brand w-full`.

---

## 6. Inputs / Badge / Dialog

- **Input `input.tsx:9`:** `bg-muted/50 h-11 w-full rounded-xl px-4 py-3 text-sm border border-border placeholder muted selection primary/10 focus:border-primary/30 ring-2`
- **Badge `badge.tsx:7`:** `rounded-full border px-2.5 py-0.5 text-[11px] font-semibold gap-1`
- **Dialog `dialog.tsx:40`:** overlay `fixed inset-0 bg-black/40 blur-sm fade-in`, content `fixed center -50% w-[calc(100%-2rem)] sm:max-w-lg grid gap-4 rounded-[2.5rem] border bg-card p-8 shadow-2xl`, close `top-6 right-6 rounded-full bg-secondary/50 p-2`
- **Tabs `tabs.tsx:16`:** `inline-flex h-10 rounded-xl glass-subtle p-1`, trigger `rounded-lg px-3 py-1.5 text-sm active:glass-strong shadow-md`
- **Switch `switch.tsx:13`:** `h-6 w-11 rounded-full border-2 data-[checked]:bg-primary data-[unchecked]:bg-input`, thumb `h-5 w-5 rounded-full bg-white shadow translate-x 0→5`

---

## 7. Navigation — `desktop-sidebar.tsx:196`, `mobile-bottom-nav.tsx:25`, `mobile-more-sheet.tsx:140`, `app/app/page.tsx:412`

**Desktop Sidebar (`w-[88px]`):**
- Bg `absolute inset-0 bg-card/80 backdrop-blur-2xl border-r`, logo `py-3 border-b w-10 h-10 rounded-xl bg-card border text-foreground` + green dot.
- `NavButton:133` `flex-col gap-1.5 w-full rounded-xl py-3 border-l-2` active `bg-brand/10 text-brand border-brand` (reverted per request, logo now neutral). Icon `w-5 h-5`, label `11px 550 -0.01em`.
- Flyout `left-[88px] w-[240px] bg-popover/95 blur-2xl border-r`, header `w-7 h-7 rounded-lg bg accent 15%`, items `px-3 py-2.5 rounded-lg text-sm active brand/10`.

**Mobile Bottom Nav (`h-[84px] rounded-t-3xl bg-card/85 blur-2xl border-t`):**
- 4 items + Scan `h-14 w-14 -mt-6 rounded-xl bg-brand shadow-brand/20`, active top indicator `w-6 h-1 rounded-b-full bg-brand`, icon `22px`, label `10px medium`.

**More Sheet (`max-h-[85vh] rounded-t-3xl bg-background border-t`):**
- Header `bg-background/80 blur-xl px-5 py-4`, search `h-10 pl-9 rounded-xl bg-muted`, sections filtered, `w-9 h-9 rounded-xl bg-muted` + `14px medium` + chevron.

**App Shell (`app/app/page.tsx:413`):**
- Header `sticky h-14 px-4 bg-background/80 blur-xl border-b md:transparent`, mobile logo `w-8 h-8 rounded-xl bg-brand` + brand `text-sm bold`.
- Main `px-4 pb-nav pt-4 md:px-8`, FAB `fixed right-4 h-14 w-14 rounded-xl bg-brand shadow-brand/20 hover:scale-105`.

---

## 8. Pages

| Page | Shell | Key Patterns |
|------|-------|--------------|
| **Home** `home-dashboard.tsx:165` | `max-w-4xl space-y-6 pb-safe-nav` | `isLoading` skeleton `bg-muted pulse`, hero `p-8 r68` `text-score 3xl`, stats `glass-strong p-5`, `HydrationTracker`, weekly `h-28 BarChart` |
| **Landing** `landing-page.tsx:60` | `max-w-6xl` | nav `bg-background/80 blur-xl h-16`, hero `pt-32 text-hero gradient`, features `grid 3 gap-6 glass-strong card-hover`, pricing `glass-strong p-8` + `badge-shine` |
| **Health Profile** `health-profile.tsx:342` | `max-w-2xl space-y-4` | header `glass-strong` + top gradient `premium amber/pro emerald`, avatar `rounded-2xl shadow`, stats ring `h-20`, quality `h-1.5 progress` |
| **Product** `product-result.tsx:289` | `max-w-3xl space-y-4` | header `w-14 h-14 card`, tabs `sticky top-14 muted/50 p-1`, score `w-48 rounded-full border-8`, macros `h-2` |
| **Subscription** `subscription/page.tsx:293` | `max-w-7xl` | hero `bg-black/55 blur-2xl rounded-2xl`, toggle `rounded-full bg-muted p-1`, cards `rounded-2xl p-5 hover:-translate-y-1` |
| **Auth** `auth/login:84` | `lg:w-1/2` split | left `from-brand/18 to-emerald/14 blur 100px` + `rounded-3xl`, right `glass-strong rounded-3xl p-6` inputs `h-12 muted/50` |

---

## 9. Utilities — `app/globals.css`

- **Animations:** `fadeIn 0.3s`, `scaleIn 0.2s`, `pulse-dot 2s`, `slide-in-bottom 0.3s`, `shake 0.4s`, `bounce-in 0.5s`, `score-fill 1.2s`, `fire-glow 2s`, `shine 3s`, `badge-shine 3s`, `gradient-shift 3s`, `wave 3s`.
- **Interactions:** `haptic-press scale 0.97` `311`, `hover-lift -1px` `317`, `list-interactive translateX 2px` `326`, `card-hover -2px` `363`, `focus-ring brand` `541`.
- **Helpers:** `no-scrollbar`, `text-balance`, `skeleton pulse 2s` `553`, `glass-card hover -1px`, `tooltip data-tooltip` `595`, `recharts tooltip hsl(0 0% 6%)` `732`, `content-visibility-auto` `836`.
- **iOS:** `min-height 100dvh`, `overscroll none`, safe-area paddings, `button min-height 44px`.

---

## 10. Checklist — How to Build a New Screen

1. Wrap in `max-w-2xl mx-auto space-y-6 pb-safe-nav` (or `4xl/6xl` for marketing)
2. Use `glass-strong border border-border rounded-2xl p-5` for cards
3. Header: `h-9 w-9 rounded-xl bg-brand-muted` + `h3 13px` + `p xs muted`
4. Button: `h-11 rounded-xl bg-brand text-brand-foreground` (primary) or `ghost h-9` (secondary)
5. Label: `section-label` (11px uppercase) + value `text-score`
6. Add `haptic-press` + `card-hover` where interactive

*Single source of truth: `app/layout.tsx` (fonts), `app/globals.css` (tokens, glass, typography), `lib/plan-limits.ts` (gating), `components/ui/*` (primitives).*

