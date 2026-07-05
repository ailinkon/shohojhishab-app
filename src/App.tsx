/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, HelpCircle, Sun, Moon } from 'lucide-react';
import { Language } from './types';
import { TRANSLATIONS } from './constants';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import LandConverterTab from './components/LandConverterTab';
import GeneralConverterTab from './components/GeneralConverterTab';
import CurrencyConverterTab from './components/CurrencyConverterTab';
import BottomSheet from './components/BottomSheet';

export default function App() {
  // Global App States
  const [lang, setLang] = useState<Language>('bn'); // Default to Bengali as requested
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0); // Tab index (0: Land, 1: General, 2: Currency)
  const [useBengaliDigits, setUseBengaliDigits] = useState<boolean>(true);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[lang];

  // Sync Tailwind dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Read OS dark mode preference on first load
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.matches) {
      setDarkMode(true);
    }
  }, []);

  // Show Toast Helper with auto-dismiss
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320] dark:text-[#FAF6F0] transition-colors duration-300 flex flex-col font-sans">
      {/* Container holding the mobile-first mockup frame (centered on desktop, native on mobile) */}
      <div className="w-full max-w-md mx-auto bg-[#FFFDF9] dark:bg-[#2D2421] min-h-screen shadow-2xl relative flex flex-col pb-24 border-x border-gray-150/40 dark:border-gray-900/30">
        
        {/* APP HEADER */}
        <Header
          lang={lang}
          setLang={setLang}
        />

        {/* ACTIVE TAB CONTENT WINDOW WITH TRANSITION */}
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18 }}
              className="px-4 py-5 space-y-6"
            >
              {activeTab === 0 && (
                <LandConverterTab
                  lang={lang}
                  useBengaliDigits={useBengaliDigits}
                  setUseBengaliDigits={setUseBengaliDigits}
                  showToast={showToast}
                />
              )}
              {activeTab === 1 && (
                <GeneralConverterTab
                  lang={lang}
                  useBengaliDigits={useBengaliDigits}
                  setUseBengaliDigits={setUseBengaliDigits}
                  showToast={showToast}
                />
              )}
              {activeTab === 2 && (
                <CurrencyConverterTab
                  lang={lang}
                  useBengaliDigits={useBengaliDigits}
                  setUseBengaliDigits={setUseBengaliDigits}
                  showToast={showToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* PERSISTENT FOOTER DISCLAIMER */}
        <footer className="px-5 py-4 bg-[#FAF6F0]/40 dark:bg-[#221B19]/20 border-t border-[#FAF6F0] dark:border-[#221B19]/50 space-y-2 text-center pb-24">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed max-w-xs mx-auto">
            {t.disclaimer}
          </p>

          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
            {t.developerCredit}
          </p>
          
          <div className="flex items-center justify-center gap-4 pt-1.5 border-t border-dashed border-[#FAF6F0] dark:border-gray-800">
            {/* About popup trigger */}
            <button
              id="about-drawer-trigger"
              onClick={() => setIsAboutOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C96F4A] dark:text-[#E0855E] hover:underline"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t.about}</span>
            </button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600">
              v1.0.0
            </span>
          </div>
        </footer>

        {/* BOTTOM NAVIGATION BAR */}
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
        />

        {/* ABOUT BOTTOM SHEET */}
        <BottomSheet
          isOpen={isAboutOpen}
          onClose={() => setIsAboutOpen(false)}
          title={t.aboutTitle}
          lang={lang}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl" role="img" aria-label="logo">🌾</span>
              <div>
                <h4 className="font-extrabold text-base text-[#2B2320] dark:text-[#FAF6F0]">
                  {t.appName}
                </h4>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                  {t.appSubtitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {t.aboutDescription}
            </p>

            <div className="p-4 bg-[#FAF6F0] dark:bg-[#221B19] rounded-2xl border border-gray-150/50 dark:border-gray-800 space-y-2">
              <h5 className="text-xs font-bold text-[#C96F4A] dark:text-[#E0855E] uppercase tracking-wider">
                ⚖️ {lang === 'en' ? 'General Conversion formulas' : 'পরিমাপের নির্ভরযোগ্য সূত্রাবলী'}
              </h5>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {lang === 'en'
                  ? 'All metric units follow international standards (e.g., SI system). Traditional South Asian weight factors (tola, poa, seer, maund) follow historical BSTI conversions (1 tola = 11.664 g). Land factors map standard Bangladesh AC Land regional classifications.'
                  : 'সকল পরিমাপের সূত্র ও মেট্রিক এককসমূহ আন্তর্জাতিকভাবে স্বীকৃত মান অনুযায়ী সাজানো হয়েছে। দেশীয় ঐতিহ্যগত ওজন (তোলা, পোয়া, সের, মণ) পরিমাপের ক্ষেত্রে বিএসটিআই (BSTI) স্ট্যান্ডার্ড অনুসৃত হয়েছে (১ তোলা = ১১.৬৬৪ গ্রাম)।'}
              </p>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 italic text-center">
              {lang === 'en'
                ? 'Made with ☕ and care for Bangladesh & South Asia.'
                : 'সবাই যাতে সহজে পরিমাপ ও টাকার হিসাব করতে পারেন, সেজন্য ভালোবাসা দিয়ে তৈরি।'}
            </p>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-center pt-1 border-t border-dashed border-[#FAF6F0] dark:border-gray-800">
              {t.developerCredit}
            </p>
          </div>
        </BottomSheet>

        {/* FLOATING DARK MODE TOGGLE (FAB) */}
        <motion.button
          id="theme-toggle-fab"
          onClick={() => setDarkMode(!darkMode)}
          whileHover={{ scale: 1.1, rotate: 8 }}
          whileTap={{ scale: 0.9, rotate: -8 }}
          className="absolute bottom-20 right-4 z-40 p-3 rounded-full bg-[#FAF6F0] dark:bg-[#221B19] text-[#C96F4A] dark:text-amber-500 shadow-lg hover:shadow-xl border border-gray-150/40 dark:border-gray-800/80 flex items-center justify-center cursor-pointer transition-colors duration-200"
          title={darkMode ? 'Light Theme' : 'Dark Theme'}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-amber-500 fill-amber-500 animate-pulse" />
          ) : (
            <Moon className="w-5 h-5 text-[#C96F4A]" />
          )}
        </motion.button>

        {/* FLOATING TOAST NOTIFICATION */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.9, x: '-50%' }}
              animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
              exit={{ opacity: 0, y: 16, scale: 0.9, x: '-50%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 22 }}
              className="absolute bottom-24 left-1/2 z-50 px-4 py-2.5 bg-[#2B2320]/95 dark:bg-[#FAF6F0]/95 text-[#FAF6F0] dark:text-[#2B2320] rounded-full shadow-lg flex items-center gap-2 border border-[#FAF6F0]/10 dark:border-gray-800/10 pointer-events-none select-none text-xs font-bold whitespace-nowrap backdrop-blur-sm"
            >
              <span className="text-sm">📋</span>
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
