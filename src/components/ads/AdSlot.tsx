import React, { useEffect, useRef, useState, useMemo } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';
import { motion } from 'motion/react';
import { Layout } from 'lucide-react';

interface AdSlotProps {
  zone: string;
  className?: string;
}

// ✅ BULLETPROOF trim
const safeTrim = (val: unknown): string => {
  return typeof val === 'string' ? val.trim() : '';
};

export const AdSlot: React.FC<AdSlotProps> = ({ zone, className = '' }) => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);
  const hasInjectedRef = useRef(false); // ✅ prevent duplicate scripts

  // ✅ Fetch config safely
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'monetization'));
        if (docSnap.exists()) {
          const data = docSnap.data();

          setConfig({
            ...data,
            articleAdCode: data.articleAdCode ?? '',
            sidebarAdCode: data.sidebarAdCode ?? '',
            homepageAdCode: data.homepageAdCode ?? '',
            heroAdCode: data.heroAdCode ?? '',
          } as MonetizationConfig);
        }
      } catch (error) {
        console.error('Error fetching monetization config:', error);
      }
    };

    fetchConfig();

    const isAdminSession = localStorage.getItem('cb_admin_session');
    if (isAdminSession || auth.currentUser) {
      setIsAdmin(true);
    }
  }, []);

  // ✅ Memoized zone logic (stable + safe)
  const zoneSettings = useMemo(() => {
    if (!config) return { enabled: false, network: 'Off', code: '' };

    let enabled = false;
    let network = 'Off';
    let code: unknown = '';

    if (zone === 'post-detail-top' || zone === 'post-detail-bottom') {
      enabled = config.articleAdsEnabled;
      network = config.articleAdNetwork;
      code = config.articleAdCode;

      if (zone === 'post-detail-top' && !config.aboveArticleAdEnabled) enabled = false;
      if (zone === 'post-detail-bottom' && !config.belowArticleAdEnabled) enabled = false;
    } else if (zone === 'sidebar') {
      enabled = config.sidebarAdEnabled;
      network = config.articleAdNetwork;
      code = config.sidebarAdCode;
    } else if (zone.startsWith('homepage')) {
      enabled = config.homepageAdsEnabled;
      network = config.homepageAdNetwork;
      code = config.homepageAdCode;

      if (zone === 'homepage-hero-bottom') {
        enabled = config.heroAdEnabled;
        code = config.heroAdCode;
      }
    } else if (zone === 'between-posts') {
      enabled = config.blogAdsEnabled;
      network = config.articleAdNetwork;
      code = config.articleAdCode;
    } else {
      const legacy = config.zones?.[zone];
      enabled = legacy?.enabled || false;
      network = legacy?.network || 'Custom Code';
      code = legacy?.adCode;
    }

    return {
      enabled,
      network,
      code: safeTrim(code), // ✅ sanitize here once
    };
  }, [config, zone]);

  // ✅ Lazy load
  useEffect(() => {
    if (!config || !adRef.current || !config.masterSwitch) return;

    if (!zoneSettings.enabled || zoneSettings.network === 'Off' || !zoneSettings.code) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(adRef.current);
    return () => observer.disconnect();
  }, [config, zoneSettings]);

  // ✅ Inject ads safely (NO duplicates)
  useEffect(() => {
    if (!isVisible || !config || !adRef.current || isAdmin) return;
    if (!zoneSettings.code || zoneSettings.network === 'Off') return;
    if (hasInjectedRef.current) return; // ✅ STOP duplicates

    const container = adRef.current;
    container.innerHTML = zoneSettings.code;
    hasInjectedRef.current = true;

    const scripts = container.getElementsByTagName('script');

    for (let i = 0; i < scripts.length; i++) {
      const s = document.createElement('script');
      const original = scripts[i];

      for (let j = 0; j < original.attributes.length; j++) {
        const attr = original.attributes[j];
        s.setAttribute(attr.name, attr.value);
      }

      s.textContent = original.textContent;
      document.body.appendChild(s);
    }

    // ✅ AdSense safe push
    if (zoneSettings.code.includes('adsbygoogle') || zoneSettings.network === 'AdSense') {
      try {
        (window as any).adsbygoogle = (window as any).adsbygoogle || [];
        (window as any).adsbygoogle.push({});
      } catch (e) {
        console.error('AdSense error:', e);
      }
    }
  }, [isVisible, config, isAdmin, zoneSettings]);

  if (!config || !config.masterSwitch) return null;

  // ✅ safer viewport checks
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  if (!zoneSettings.enabled || zoneSettings.network === 'Off') return null;
  if (config.hideAdsOnMobile && isMobile) return null;
  if (zone === 'sidebar' && !isDesktop) return null;

  // ✅ Admin placeholder
  if (isAdmin && config.hideAdsForAdmin) {
    return (
      <motion.div className={`my-8 flex flex-col items-center ${className}`}>
        <span className="text-[10px] text-gray-400 mb-2">
          Advertisement Placeholder
        </span>
        <div className="w-full max-w-4xl min-h-[100px] border-2 border-dashed rounded-2xl flex items-center justify-center p-8">
          <Layout className="h-6 w-6 text-gray-300 mr-2" />
          <p>Ad Zone: {zone.replace(/-/g, ' ')}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={adRef}
      className={`my-8 flex flex-col items-center overflow-hidden ${className}`}
    >
      <span className="text-[10px] text-gray-400 mb-2">
        Advertisement
      </span>
      <div className="w-full flex justify-center min-h-[50px]" />
    </motion.div>
  );
};