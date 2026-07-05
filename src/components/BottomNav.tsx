/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BottomNavProps {
  activeTab: number;
  setActiveTab: (idx: number) => void;
  lang: Language;
}

export default function BottomNav({
  activeTab,
  setActiveTab,
  lang,
}: BottomNavProps) {
  const t = TRANSLATIONS[lang];

  const navItems = [
    { idx: 0, label: t.landConverter, icon: '🌾' },
    { idx: 1, label: t.generalConverter, icon: '📏' },
    { idx: 2, label: t.currency, icon: '💱' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#FFFDF9]/95 dark:bg-[#2D2421]/95 backdrop-blur-md border-t border-[#FAF6F0] dark:border-gray-800 pb-safe shadow-lg z-30 select-none">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive = activeTab === item.idx;
          return (
            <button
              key={item.idx}
              id={`nav-tab-${item.idx}`}
              onClick={() => setActiveTab(item.idx)}
              className="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 text-center rounded-xl transition-all duration-200 active:scale-95"
            >
              <span
                className={`text-xl transition-transform duration-150 ${
                  isActive ? 'scale-125 -translate-y-0.5' : 'opacity-60 hover:opacity-100'
                }`}
                role="img"
                aria-label={item.label}
              >
                {item.icon}
              </span>
              <span
                className={`text-[10px] font-bold tracking-tight mt-1 transition-colors duration-150 ${
                  isActive
                    ? 'text-[#C96F4A] dark:text-[#E0855E]'
                    : 'text-gray-400 dark:text-gray-500 font-medium'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-4 h-1 bg-[#C96F4A] dark:bg-[#E0855E] rounded-full mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
