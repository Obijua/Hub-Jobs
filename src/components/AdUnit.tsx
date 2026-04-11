import { useEffect, useRef } from 'react';

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
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const pushAd = () => {
      if (initialized.current) return;
      
      // Final check for width before pushing
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
      // AdSense typically requires at least 120px for responsive ads
      if (adRef.current && adRef.current.offsetWidth >= 120) {
        pushAd();
        return true;
      }
      return false;
    };

    // Try immediately
    if (checkWidth()) return;

    // Fallback: Use ResizeObserver to wait for width
    const observer = new ResizeObserver(() => {
      if (checkWidth()) {
        observer.disconnect();
      }
    });

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    // Safety timeout - only push if width is actually > 0
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
  }, []);

  const clientId = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  if (!clientId || !slot) return null;

  return (
    <div className={`ad-container my-4 ${className}`}>
      <p className="text-[10px] text-gray-400 text-center 
        mb-1 uppercase tracking-widest">
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
