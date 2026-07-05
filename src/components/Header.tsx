/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sun, Moon, Languages } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
}

export default function Header({
  lang,
  setLang,
}: HeaderProps) {
  const t = TRANSLATIONS[lang];

  return (
    <header className="sticky top-0 bg-[#FFFDF9]/95 dark:bg-[#2D2421]/95 backdrop-blur-md border-b border-[#FAF6F0] dark:border-gray-800 px-4 py-3 z-40 flex items-center justify-between shadow-sm select-none">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-2">
        <span className="text-2xl" role="img" aria-label="shohajhishab-logo">🌾</span>
        <div>
          <h1 className="text-base font-extrabold text-[#2B2320] dark:text-[#FAF6F0] tracking-tight leading-tight">
            {t.appName}
          </h1>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-2">
        {/* Language switch */}
        <button
          id="lang-toggle-btn"
          onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
          className="flex items-center gap-1 min-h-[38px] px-2.5 rounded-full bg-[#FAF6F0] dark:bg-[#221B19] text-[#C96F4A] hover:bg-[#C96F4A]/10 border border-gray-200 dark:border-gray-800 transition-all font-bold text-xs"
          title={lang === 'en' ? 'বাংলা সংস্করণ' : 'English Version'}
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{lang === 'en' ? 'বাংলা' : 'EN'}</span>
        </button>
      </div>
    </header>
  );
}
