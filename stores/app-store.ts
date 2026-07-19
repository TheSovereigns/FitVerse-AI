import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { View, DailyActivity, MetabolicPlan, ScanHistoryItem, ProductAnalysis } from '@/lib/types'

interface AppState {
  currentView: View
  setCurrentView: (view: View) => void

  dailyActivity: DailyActivity
  setDailyActivity: (activity: DailyActivity) => void
  addScannedProduct: (product: ProductAnalysis) => void

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

  isAdmin: boolean
  setIsAdmin: (v: boolean) => void

  showUpgradeModal: boolean
  setShowUpgradeModal: (v: boolean) => void
}

const today = new Date().toISOString().split('T')[0]!

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: 'home' as View,
      setCurrentView: (view) => set({ currentView: view }),

      dailyActivity: {
        date: today,
        scannedProducts: [],
        generatedDiets: [],
        generatedWorkouts: [],
      },
      setDailyActivity: (activity) => set({ dailyActivity: activity }),
      addScannedProduct: (product) =>
        set((state) => {
          const updated = {
            ...state.dailyActivity,
            scannedProducts: [...state.dailyActivity.scannedProducts, product],
          }
          return { dailyActivity: updated }
        }),

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

      isAdmin: false,
      setIsAdmin: (v) => set({ isAdmin: v }),

      showUpgradeModal: false,
      setShowUpgradeModal: (v) => set({ showUpgradeModal: v }),
    }),
    {
      name: 'fitverse-app-store',
      partialize: (state) => ({
        dailyActivity: state.dailyActivity,
        scanHistory: state.scanHistory,
        userMetabolicPlan: state.userMetabolicPlan,
      }),
    }
  )
)
