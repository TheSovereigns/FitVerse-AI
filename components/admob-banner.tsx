"use client"

import { useEffect, useState } from 'react';

const AdMobBanner = () => {
  const [admob, setAdmob] = useState<any>(null);

  useEffect(() => {
    // A biblioteca do AdMob só funciona no ambiente do dispositivo,
    // então a importamos dinamicamente.
    const initAdMob = async () => {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const { AdMob } = await import('@admob-plus/capacitor');
        setAdmob(AdMob);
      }
    };
    initAdMob();
  }, []);

  useEffect(() => {
    if (admob) {
      admob.bannerShow({
        // Substitua pelo ID do seu bloco de anúncios do AdMob
        adId: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy',
        position: 'bottom',
        margin: 0,
      });
    }
  }, [admob]);

  // Este componente não renderiza nada visualmente, ele apenas comanda o SDK nativo.
  return null;
};

export default AdMobBanner;