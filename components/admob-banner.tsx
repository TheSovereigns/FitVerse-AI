"use client"

import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

const AdMobBanner = () => {
  const [admob, setAdmob] = useState<any>(null)

  useEffect(() => {
    const initAdMob = async () => {
      if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
        try {
          const mod = await import('@admob-plus/capacitor')
          const AdMob = (mod as any).AdMob || mod.default
          setAdmob(AdMob)
        } catch (e) {
          console.warn('AdMob not available:', e)
        }
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