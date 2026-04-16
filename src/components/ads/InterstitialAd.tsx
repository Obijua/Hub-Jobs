import React, { useEffect, useState } from 'react';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { MonetizationConfig } from '../../types';

export const InterstitialAd = () => {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'monetization');
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return;

        const data = docSnap.data() as MonetizationConfig;
        setConfig(data);

        const isAdmin = !!auth.currentUser;

        // ✅ Safely access zone
        const zone = data.zones?.['interstitial-popunder'];

        const shouldShow =
          zone?.enabled &&
          (!isAdmin || !data.hideAdsForAdmin);

        if (!shouldShow || !zone) return;

        // Check session timing
        const lastShown = sessionStorage.getItem('interstitial-last-shown');
        const now = Date.now();

        if (
          !lastShown ||
          now - parseInt(lastShown, 10) > 10 * 60 * 1000
        ) {
          const container = document.createElement('div');
          container.id = 'interstitial-container';
          container.innerHTML = zone.adCode;

          // Execute scripts safely
          const scripts = container.getElementsByTagName('script');

          for (let i = 0; i < scripts.length; i++) {
            const original = scripts[i];
            const s = document.createElement('script');

            // Copy attributes
            for (let j = 0; j < original.attributes.length; j++) {
              const attr = original.attributes[j];
              s.setAttribute(attr.name, attr.value);
            }

            s.textContent = original.textContent;
            document.body.appendChild(s);
          }

          sessionStorage.setItem(
            'interstitial-last-shown',
            now.toString()
          );
        }
      } catch (error) {
        console.error('Error fetching monetization config:', error);
      }
    };

    fetchConfig();
  }, []);

  return null;
};