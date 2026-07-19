"use client"

import { useEffect, useState } from 'react'

const AdMobBanner = () => {
  const [admob, setAdmob] = useState<any>(null)

  useEffect(() => {
    const initAdMob = async () => {
      if (typeof window === 'undefined') return
      
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (!Capacitor.isNativePlatform()) return
        
        const mod = await import('@admob-plus/capacitor')
        const AdMob = (mod as any).AdMob || mod.default
        setAdmob(AdMob)
      } catch (e) {
        // AdMob not available - this is expected on web builds
      }
    }
    initAdMob()
  }, [])

  useEffect(() => {
    if (admob) {
      try {
        admob.bannerShow({
          adId: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
          position: 'bottom',
          margin: 0,
        })
      } catch (e) {
        console.warn('Failed to show banner:', e)
      }
    }
  }, [admob])

  return null
}

export default AdMobBanner
