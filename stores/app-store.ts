import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { View, DailyActivity, MetabolicPlan, ScanHistoryItem, ProductAnalysis } from '@/lib/types'

function getToday(): string {
  return new Date().toISOString().split('T')[0]!
}

function stripProductImage<T extends { image?: string }>(p: T): Omit<T, 'image'> {
  const { image: _image, ...rest } = p as T & { image?: string }
  void _image
  return rest
}

function safeStorage() {
  if (typeof window === 'undefined') return undefined
  const base = {
    getItem: (name: string) => localStorage.getItem(name),
    setItem: (name: string, value: string) => {
      try {
        localStorage.setItem(name, value)
      } catch (e: unknown) {
        const err = e as DOMException | Error
        const isQuota =
          (err as DOMException)?.name === 'QuotaExceededError' ||
          (err as Error)?.message?.includes('QuotaExceededError') ||
          (err as Error)?.message?.includes('exceeded the quota')
        if (isQuota) {
          try {
            // eslint-disable-next-line no-console
            console.warn('[fitverse-app-store] QuotaExceededError - clearing persisted store')
            localStorage.removeItem(name)
          } catch {}
        } else {
          throw e
        }
      }
    },
    removeItem: (name: string) => localStorage.removeItem(name),
  }
  return createJSONStorage(() => base)
}

interface AppState {
  currentView: View
  setCurrentView: (view: View) => void

  dailyActivity: DailyActivity
  setDailyActivity: (activity: DailyActivity) => void
  addScannedProduct: (product: ProductAnalysis) => void
  resetDailyActivity: () => void
  getToday: () => string

  scanHistory: ScanHistoryItem[]
  addScanHistory: (item: ScanHistoryItem) => void
  setScanHistory: (items: ScanHistoryItem[]) => void

  userMetabolicPlan: MetabolicPlan | null
  setUserMetabolicPlan: (plan: MetabolicPlan | null) => void

  isAnalyzing: boolean
  setIsAnalyzing: (v: boolean) => void

  scanError: string | null
  setScanError: (e: string | null) => void

  analysisResult: ProductAnalysis | null
  setAnalysisResult: (r: ProductAnalysis | null) => void

  scannedImage: string | null
  setScannedImage: (img: string | null) => void

  isAdmin: boolean
  setIsAdmin: (v: boolean) => void

  showUpgradeModal: boolean
  setShowUpgradeModal: (v: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'home' as View,
      setCurrentView: (view) => set({ currentView: view }),

      dailyActivity: {
        date: getToday(),
        scannedProducts: [],
        generatedDiets: [],
        generatedWorkouts: [],
      },
      setDailyActivity: (activity) => set({ dailyActivity: activity }),
      addScannedProduct: (product) =>
        set((state) => {
          const today = getToday()
          // Lazily roll over to new day if stale (computed at call-time, not import-time)
          const base =
            state.dailyActivity.date !== today
              ? { date: today, scannedProducts: [] as ProductAnalysis[], generatedDiets: [] as string[], generatedWorkouts: [] as string[] }
              : state.dailyActivity
          const updated = {
            ...base,
            scannedProducts: [...base.scannedProducts, product],
          }
          return { dailyActivity: updated }
        }),
      resetDailyActivity: () =>
        set({
          dailyActivity: {
            date: getToday(),
            scannedProducts: [],
            generatedDiets: [],
            generatedWorkouts: [],
          },
        }),
      getToday,

      scanHistory: [],
      addScanHistory: (item) =>
        set((state) => ({ scanHistory: [item, ...state.scanHistory] })),
      setScanHistory: (items) => set({ scanHistory: items }),

      userMetabolicPlan: null,
      setUserMetabolicPlan: (plan) => set({ userMetabolicPlan: plan }),

      isAnalyzing: false,
      setIsAnalyzing: (v) => set({ isAnalyzing: v }),

      scanError: null,
      setScanError: (e) => set({ scanError: e }),

      analysisResult: null,
      setAnalysisResult: (r) => set({ analysisResult: r }),

      scannedImage: null,
      setScannedImage: (img) => set({ scannedImage: img }),

      isAdmin: false,
      setIsAdmin: (v) => set({ isAdmin: v }),

      showUpgradeModal: false,
      setShowUpgradeModal: (v) => set({ showUpgradeModal: v }),
    }),
    {
      name: 'fitverse-app-store',
      version: 1,
      storage: safeStorage(),
      // Do not persist large/blob fields: strip `image` (base64 or blob urls) from persisted slices
      partialize: (state) => ({
        dailyActivity: {
          ...state.dailyActivity,
          scannedProducts: state.dailyActivity.scannedProducts.map((p) => stripProductImage(p) as ProductAnalysis),
        },
        scanHistory: state.scanHistory.map(({ image: _img, ...rest }) => ({ ...rest, image: '' as string }) as ScanHistoryItem),
        userMetabolicPlan: state.userMetabolicPlan,
      }),
      migrate: (persistedState, version) => {
        const state = persistedState as Record<string, unknown> | null
        if (!state) return persistedState as unknown as AppState
        // version 0 -> 1: strip persisted `image` fields that may be base64/blob and cause quota
        if (version === 0) {
          const s = state as { scanHistory?: ScanHistoryItem[]; dailyActivity?: DailyActivity }
          if (Array.isArray(s.scanHistory)) {
            s.scanHistory = s.scanHistory.map(({ image: _img, ...rest }) => ({ ...rest, image: '' }) as ScanHistoryItem)
          }
          if (s.dailyActivity?.scannedProducts) {
            s.dailyActivity = {
              ...s.dailyActivity,
              scannedProducts: s.dailyActivity.scannedProducts.map((p) => stripProductImage(p) as ProductAnalysis),
            }
          }
        }
        return state as unknown as AppState
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          try {
            localStorage.removeItem('fitverse-app-store')
          } catch {}
          return
        }
        if (state && state.dailyActivity.date !== state.getToday()) {
          state.resetDailyActivity()
        }
      },
    }
  )
)
