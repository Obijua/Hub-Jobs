import { useEffect, useRef, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../types';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  className?: string;
  responsive?: boolean;
}

const AdUnit = ({ 
  slot, 
  format = 'auto',
  className = '',
  responsive = true 
}: AdUnitProps) => {
  const [adConfig, setAdConfig] = useState<MonetizationConfig | null>(null);
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const fetchAdConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'monetization'));
        if (snap.exists()) {
          setAdConfig(snap.data() as MonetizationConfig);
        }
      } catch (e) {
        console.error('Ad config error:', e);
      }
    };
    fetchAdConfig();
  }, []);

  useEffect(() => {
    if (!adConfig || initialized.current || !adConfig.masterSwitch) return;

    const pushAd = () => {
      if (initialized.current) return;
      
      if (!adRef.current || adRef.current.offsetWidth === 0) {
        return;
      }

      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) {
        console.error('AdSense error:', e);
      }
    };

    const checkWidth = () => {
      if (adRef.current && adRef.current.offsetWidth >= 120) {
        pushAd();
        return true;
      }
      return false;
    };

    if (checkWidth()) return;

    const observer = new ResizeObserver(() => {
      if (checkWidth()) {
        observer.disconnect();
      }
    });

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    const timeout = setTimeout(() => {
      if (!initialized.current) {
        checkWidth();
      }
      observer.disconnect();
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(timeout);
    };
  }, [adConfig]);

  if (!adConfig || !adConfig.masterSwitch) return null;

  const clientId = adConfig.adsensePublisherId;
  if (!clientId || !slot) return null;

  return (
    <div className={`ad-container my-4 ${className}`}>
      <p className="text-[10px] text-gray-400 text-center mb-1 uppercase tracking-widest">
        Advertisement
      </p>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  );
};

export default AdUnit;
