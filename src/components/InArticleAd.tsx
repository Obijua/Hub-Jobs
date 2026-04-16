import { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface InArticleAdProps {
  position: number;
}

// ✅ SAFE helper (prevents ALL trim crashes)
const safeTrim = (val?: string) => (typeof val === 'string' ? val.trim() : '');

const InArticleAd = ({ position }: InArticleAdProps) => {
  const [adConfig, setAdConfig] = useState<any>(null);
  const adRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // ✅ Fetch config safely + normalize fields
  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'monetization'));
        if (snap.exists()) {
          const data = snap.data();

          setAdConfig({
            ...data,
            articleAdCode: data.articleAdCode ?? '',
            articleAdNetwork: data.articleAdNetwork ?? 'Off',
          });
        }
      } catch (e) {
        console.error('Ad config error:', e);
      }
    };

    fetchAdConfig();
  }, []);

  // ✅ Inject ad safely
  useEffect(() => {
    if (!adConfig || initialized.current || !adRef.current) return;
    initialized.current = true;

    if (!adConfig.masterSwitch || !adConfig.articleAdsEnabled) return;

    const container = adRef.current;
    const network = adConfig.articleAdNetwork;
    const code = adConfig.articleAdCode;

    // ✅ FIXED: safe check (NO MORE CRASH)
    if (network === 'Off' || !safeTrim(code)) return;

    try {
      const range = document.createRange();
      const fragment = range.createContextualFragment(code);

      container.innerHTML = '';
      container.appendChild(fragment);

      // ✅ AdSense safe push
      if (network === 'AdSense' || code.includes('adsbygoogle')) {
        try {
          (window as any).adsbygoogle =
            (window as any).adsbygoogle || [];
          (window as any).adsbygoogle.push({});
        } catch (e) {
          console.error('AdSense push error:', e);
        }
      }
    } catch (e) {
      console.error('Error injecting ad code:', e);
    }
  }, [adConfig]);

  // ✅ Guards
  if (!adConfig?.masterSwitch || !adConfig?.articleAdsEnabled) return null;
  if (adConfig?.articleAdNetwork === 'Off') return null;

  const isAdmin = !!localStorage.getItem('cb_admin_session');
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768;

  if (adConfig.hideAdsForAdmin && isAdmin) {
    return (
      <div className="my-8 p-4 border-2 border-dashed rounded-2xl text-center">
        <p className="text-xs font-black mb-1">
          📢 Ad Slot {position}
        </p>
        <p className="text-[10px]">
          Ads hidden for admin
        </p>
      </div>
    );
  }

  if (adConfig.hideAdsOnMobile && isMobile) return null;

  return (
    <div className="my-8 overflow-hidden">
      <div className="flex items-center justify-center space-x-4 mb-3">
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          Advertisement
        </span>
        <div className="h-[1px] flex-1 bg-gray-100 dark:bg-gray-800" />
      </div>

      <div className="flex justify-center min-h-[100px]">
        <div ref={adRef} className="w-full flex justify-center" />

        {/* ✅ fallback AdSense */}
        {adConfig.articleAdNetwork === 'AdSense' &&
          !safeTrim(adConfig.articleAdCode) &&
          adConfig.adsensePublisherId &&
          adConfig.adsenseInArticleSlot && (
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%' }}
              data-ad-layout="in-article"
              data-ad-format="fluid"
              data-ad-client={adConfig.adsensePublisherId}
              data-ad-slot={adConfig.adsenseInArticleSlot}
            />
          )}
      </div>
    </div>
  );
};

export default InArticleAd;