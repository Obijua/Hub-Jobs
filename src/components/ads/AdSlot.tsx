import React, { useEffect, useRef, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';
import { motion } from 'motion/react';
import { Layout } from 'lucide-react';

interface AdSlotProps {
  zone: string;
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ zone, className = '' }) => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'monetization'));
        if (docSnap.exists()) {
          setConfig(docSnap.data() as MonetizationConfig);
        }
      } catch (error) {
        console.error('Error fetching monetization config:', error);
      }
    };

    fetchConfig();

    // Check if user is admin
    const checkAdmin = () => {
      const user = auth.currentUser;
      if (user) {
        setIsAdmin(true); 
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!config || !adRef.current || !config.zones) return;

    const zoneConfig = config.zones[zone];
    if (!zoneConfig?.isEnabled) return;

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(adRef.current);

    return () => observer.disconnect();
  }, [config, zone]);

  useEffect(() => {
    if (isVisible && config && adRef.current && !isAdmin && config.zones) {
      const zoneConfig = config.zones[zone];
      if (!zoneConfig) return;
      
      // Inject the ad code
      const container = adRef.current;
      container.innerHTML = zoneConfig.adCode;

      // Execute any scripts in the ad code
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

      // Handle AdSense push
      if (zoneConfig.adCode.includes('adsbygoogle')) {
        const pushAd = () => {
          try {
            (window as any).adsbygoogle = (window as any).adsbygoogle || [];
            (window as any).adsbygoogle.push({});
          } catch (e) {
            console.error('AdSense error in AdSlot:', e);
          }
        };

        const checkAndPush = () => {
          // AdSense typically requires at least 120px for responsive ads
          if (container.offsetWidth >= 120) {
            pushAd();
            return true;
          }
          return false;
        };

        if (!checkAndPush()) {
          const resizeObserver = new ResizeObserver(() => {
            if (checkAndPush()) {
              resizeObserver.disconnect();
            }
          });
          resizeObserver.observe(container);
          
          // Safety timeout
          setTimeout(() => resizeObserver.disconnect(), 5000);
        }
      }
    }
  }, [isVisible, config, isAdmin, zone]);

  if (!config) return null;

  const zoneConfig = config.zones ? config.zones[zone] : null;
  const shouldHideOnMobile = config.hideAdsOnMobile && window.innerWidth < 768;
  const isDesktopOnly = zone === 'sidebar';

  if (!zoneConfig?.isEnabled) return null;
  if (shouldHideOnMobile) return null;
  if (isDesktopOnly && window.innerWidth < 1024) return null;

  // Admin Placeholder
  if (isAdmin && config.hideAdsForAdmin) {
    return (
      <motion.div 
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`my-8 flex flex-col items-center ${className}`}
      >
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Advertisement Placeholder</span>
        <div className="w-full max-w-4xl min-h-[100px] border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-900/50">
          <Layout className="h-6 w-6 text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">Ad Zone: {String(zone).replace(/-/g, ' ')}</p>
          <p className="text-[10px] text-gray-400 mt-1 italic">Ads are hidden for admins</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      ref={adRef} 
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`my-8 flex flex-col items-center overflow-hidden ${className}`}
    >
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Advertisement</span>
      <div className="w-full flex justify-center min-h-[50px]">
        {/* Ad content will be injected here */}
      </div>
    </motion.div>
  );
};
