import { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface InArticleAdProps {
  position: number;
}

const InArticleAd = ({ position }: InArticleAdProps) => {
  const [adConfig, setAdConfig] = useState<any>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const snap = await getDoc(
          doc(db, 'settings', 'monetization')
        );
        if (snap.exists()) {
          setAdConfig(snap.data());
        }
      } catch (e) {
        console.error('Ad config error:', e);
      }
    };
    fetchAdConfig();
  }, []);

  useEffect(() => {
    if (!adConfig || initialized.current || !adRef.current) 
      return;
    initialized.current = true;

    // Initialize AdSense if enabled
    if (adConfig.adsenseEnabled && adConfig.adsenseInArticleSlot) {
      try {
        ((window as any).adsbygoogle = 
          (window as any).adsbygoogle || []).push({});
      } catch (e) {}
      return; // Stop if AdSense is used
    }

    // Inject Adsterra script if enabled
    if (adConfig.adsterraEnabled && adConfig.adsterraInArticleCode) {
      const container = adRef.current;
      const range = document.createRange();
      const fragment = range.createContextualFragment(
        adConfig.adsterraInArticleCode
      );
      container.appendChild(fragment);
      return; // Stop if Adsterra is used
    }

    // Inject Monetag script if enabled
    if (adConfig.monetagEnabled && adConfig.monetagInArticleCode) {
      const container = adRef.current;
      const range = document.createRange();
      const fragment = range.createContextualFragment(
        adConfig.monetagInArticleCode
      );
      container.appendChild(fragment);
    }
  }, [adConfig]);

  // Don't render anything if no ad network is enabled
  if (!adConfig) return null;
  if (
    !adConfig.adsenseEnabled && 
    !adConfig.adsterraEnabled && 
    !adConfig.monetagEnabled
  ) return null;

  // Check visibility settings
  const isAdmin = !!localStorage.getItem('cb_admin_session');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (adConfig.hideAdsForAdmin && isAdmin) {
    return (
      <div className="my-8 p-4 border-2 border-dashed border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-900/20 rounded-2xl text-center">
        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">📢 Ad Slot {position}</p>
        <p className="text-[10px] text-amber-500 font-medium">Ads are hidden for Admin. Visitors see real ads here.</p>
      </div>
    );
  }

  if (adConfig.hideAdsOnMobile && isMobile) {
    return null;
  }

  return (
    <div className="my-8 overflow-hidden">
      <div className="flex items-center justify-center space-x-4 mb-3">
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></div>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Advertisement</span>
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800"></div>
      </div>

      <div className="flex justify-center min-h-[100px]">
        {/* Priority: AdSense > Adsterra > Monetag */}
        {adConfig.adsenseEnabled && adConfig.adsensePublisherId && adConfig.adsenseInArticleSlot ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', textAlign: 'center', width: '100%' }}
            data-ad-layout="in-article"
            data-ad-format="fluid"
            data-ad-client={adConfig.adsensePublisherId}
            data-ad-slot={adConfig.adsenseInArticleSlot}
          />
        ) : (
          <div ref={adRef} className="w-full flex justify-center" />
        )}
      </div>
    </div>
  );
};

export default InArticleAd;
