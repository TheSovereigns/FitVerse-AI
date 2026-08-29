# Routing Migration Plan — VyseFit

## Current State (SPA)

- `app/app/page.tsx` is a 586-line SPA that handles 44 views via Zustand `currentView` state and `?view=` query param.
- All views are lazy-loaded with `React.lazy` / `Suspense` inside a single page component.
- Navigation is done via `setCurrentView(view)` from `useAppStore`, plus `DesktopSidebar` and `MobileBottomNav` / `MobileMoreSheet`.
- Auth is via `useAuth()` and plan gating via `usePlanLimits()` + `isViewLocked()`.
- URL sync is manual: `window.location.search` is parsed for `?view=` on mount, and `window.history.replaceState` is used for clan invites.

This SPA remains fully functional and **must not be modified** during the preparation phase.

## Target State (File-System Routing)

Migrate to Next.js App Router file-system routing under `app/app/`:

```
app/app/
  layout.tsx              # shared layout (DesktopSidebar, MobileBottomNav, auth guard, headers)
  page.tsx                # home → renders HomeDashboard (currentView === "home")
  scan/page.tsx           # scan → ScanDashboard
  training/page.tsx       # training → TrainingTab
  recipes/page.tsx        # recipes → RecipesTab
  planner/page.tsx        # planner → MetabolicPlanner / MetabolicDashboard
  profile/page.tsx        # profile → HealthProfile
  settings/page.tsx       # settings → SettingsPage
  chatbot/page.tsx        # chatbot → ChatbotTab
  clans/page.tsx          # clans → ClansTab
  sleep/page.tsx          # etc.
  ...                     # one file per View (44 total)
```

Each route will be a thin Client Component that renders its corresponding lazy view component.

### Shared Layout (`app/app/layout.tsx`)

The layout will provide:

- `useAuth()` guard (redirect to `/auth/login` if no user, loading spinner while `authLoading`)
- `DesktopSidebar` (desktop) + `MobileBottomNav` + `MobileMoreSheet` (mobile)
- Header with brand / view title / profile / admin link
- `FeatureErrorBoundary` + `Suspense` fallback
- Plan-limit checks via `usePlanLimits()` / `isViewLocked()`
- FAB scan button (hidden on `corrida` view) and `AdBanner`

For now `app/app/layout.tsx` is a minimal pass-through:

```tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

This ensures future routes like `app/app/scan/page.tsx` inherit the layout without breaking the existing SPA. The full layout with `useAuth` and `DesktopSidebar` will be added incrementally as routes are split.

### Example Route (`app/app/scan/page.tsx`)

```tsx
"use client"
import { ScanDashboard } from "@/components/scan-dashboard"
import { useRouter } from "next/navigation"
export default function ScanPage() {
  const router = useRouter()
  return <ScanDashboard onScan={()=>{}} isScanning={false} onBarcodeProduct={()=>{}} />
}
```

Additive only — `app/app/page.tsx` SPA continues to handle `/app?view=scan` until the route is fully implemented. Once migrated, navigation switches from `setCurrentView("scan")` to `next/link` / `router.push("/app/scan")`.

## Migration Steps

1. **Keep SPA intact** — Do not modify `app/app/page.tsx` yet. New routes are additive.
2. **Create `app/app/layout.tsx`** as pass-through (done). Later, extract the shared chrome (sidebar, header, bottom nav, FAB, auth guard, error boundary) from `app/app/page.tsx` into this layout so all child routes share it.
3. **Create one route at a time** — Move each `lazy(() => import(...))` view to its own `app/app/<view>/page.tsx`:
   - Copy the relevant `handleScan` / `scanHistory` / `userMetabolicPlan` logic or lift to context/store as needed.
   - Replace `setCurrentView("x")` calls with `<Link href="/app/x">` or `router.push("/app/x")`.
   - Use `useAuth()` and `usePlanLimits()` directly in the route or via the shared layout.
4. **Update navigation components** — `DesktopSidebar` and `MobileBottomNav` should use `usePathname()` + `next/link` instead of `currentView` + `onNavigate` once routes exist. Keep backward compat with `setCurrentView` until all views are migrated.
5. **Handle deep links** — Replace `?view=` parsing with proper file routes. Keep a fallback redirect: `/app?view=scan` → `/app/scan` for bookmarked URLs.
6. **Remove Zustand view state** — Once all 44 views have file routes, delete `currentView` / `setCurrentView` from `stores/app-store.ts` and remove the `?view=` effect in `app/app/page.tsx` (then `app/app/page.tsx` becomes just `home`).
7. **Verify** — Run `npx tsc --noEmit` and `next build` after each route addition; ensure no breaking changes for existing users.

## Non-Breaking Guarantees

- No modification to `app/app/page.tsx` during preparation.
- New files (`layout.tsx`, `scan/page.tsx`, `ROUTING-MIGRATION.md`) are additive and do not change existing routes.
- `npx tsc --noEmit` must pass at every step.
