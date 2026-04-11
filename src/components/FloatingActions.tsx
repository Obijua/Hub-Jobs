import React, { useState, useEffect } from 'react';
import { ArrowUp, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { SocialLinks } from '../types';

export const FloatingActions = () => {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState('https://t.me/your_channel');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);

    // Fetch telegram link
    const unsub = onSnapshot(doc(db, 'settings', 'socialLinks'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as SocialLinks;
        if (data.telegram) {
          setTelegramUrl(data.telegram.url);
          setIsVisible(data.telegram.isActive);
        }
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      unsub();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="fixed bottom-6 left-6 z-[100]">
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={scrollToTop}
              className="p-3 bg-white text-gray-400 rounded-t-lg border-x border-t border-gray-200 shadow-sm hover:bg-gray-50 transition-all"
              aria-label="Back to top"
            >
              <ArrowUp className="h-6 w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="fixed bottom-6 right-6 z-[100]">
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              onClick={scrollToTop}
              className="p-3 bg-[#3498db] text-white rounded shadow-lg hover:bg-[#2980b9] transition-all"
              aria-label="Back to top"
            >
              <ArrowUp className="h-6 w-6" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
