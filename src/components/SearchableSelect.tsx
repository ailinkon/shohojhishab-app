/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, Check, Star } from 'lucide-react';
import { Language } from '../types';

export interface SearchableSelectOption {
  id: string;
  label: string;
  secondaryLabel?: string;
  isFav?: boolean;
}

interface SearchableSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  lang: Language;
  className?: string;
  placeholder?: string;
}

const SEARCH_TRANSLATIONS = {
  en: {
    searchPlaceholder: 'Search unit...',
    noResults: 'No units found',
    favorites: 'Favorites',
    allUnits: 'All Units',
  },
  bn: {
    searchPlaceholder: 'ইউনিট খুঁজুন...',
    noResults: 'কোনো ইউনিট পাওয়া যায়নি',
    favorites: 'পছন্দের তালিকা',
    allUnits: 'সকল ইউনিট',
  }
};

export default function SearchableSelect({
  id,
  value,
  onChange,
  options,
  lang,
  className = '',
  placeholder = '',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = SEARCH_TRANSLATIONS[lang];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset search when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      // Auto focus the search bar
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.id === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    const labelMatch = opt.label.toLowerCase().includes(query);
    const secondaryMatch = opt.secondaryLabel?.toLowerCase().includes(query) || false;
    const idMatch = opt.id.toLowerCase().includes(query);
    return labelMatch || secondaryMatch || idMatch;
  });

  // Split into favorites and normal options
  const favOptions = filteredOptions.filter((opt) => opt.isFav);
  const normalOptions = filteredOptions.filter((opt) => !opt.isFav);

  const handleSelect = (optionId: string) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative flex-1 ${className}`} id={id}>
      {/* TRIGGER BUTTON */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[48px] px-4 py-2.5 bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320] dark:text-[#FAF6F0] rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C96F4A] font-semibold text-sm flex items-center justify-between gap-2 shadow-sm cursor-pointer transition-all"
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.isFav && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
          )}
          <span>
            {selectedOption ? selectedOption.label : placeholder || (lang === 'en' ? 'Select unit' : 'ইউনিট নির্বাচন করুন')}
          </span>
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* DROPDOWN OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 left-0 right-0 max-h-[280px] bg-white dark:bg-[#1C1413] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl flex flex-col overflow-hidden"
          >
            {/* SEARCH INPUT BAR */}
            <div className="p-2 border-b border-gray-100 dark:border-gray-800/80 flex items-center gap-2 bg-gray-50/50 dark:bg-[#221B19]/30">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 ml-1.5" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-[#2B2320] dark:text-[#FAF6F0] py-1 placeholder-gray-400 dark:placeholder-gray-600"
              />
            </div>

            {/* OPTIONS LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {t.noResults}
                </div>
              ) : (
                <>
                  {/* FAVORITES GROUP */}
                  {favOptions.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-amber-600 dark:text-amber-500 uppercase bg-amber-500/5 dark:bg-amber-500/10">
                        ★ {t.favorites}
                      </div>
                      {favOptions.map((opt) => (
                        <button
                          key={`fav-${opt.id}`}
                          type="button"
                          onClick={() => handleSelect(opt.id)}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#221B19]/50 transition-colors cursor-pointer ${
                            opt.id === value
                              ? 'bg-[#C96F4A]/5 dark:bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E]'
                              : 'text-[#2B2320] dark:text-[#FAF6F0]'
                          }`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            <span className="truncate">{opt.label}</span>
                          </span>
                          {opt.id === value && <Check className="w-3.5 h-3.5 text-[#C96F4A] dark:text-[#E0855E] shrink-0 ml-2" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* ALL UNITS GROUP */}
                  {normalOptions.length > 0 && (
                    <div>
                      {favOptions.length > 0 && (
                        <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-gray-400 dark:text-gray-500 uppercase bg-gray-50/50 dark:bg-[#221B19]/10 border-t border-gray-100 dark:border-gray-800/80">
                          {t.allUnits}
                        </div>
                      )}
                      {normalOptions.map((opt) => (
                        <button
                          key={`normal-${opt.id}`}
                          type="button"
                          onClick={() => handleSelect(opt.id)}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#221B19]/50 transition-colors cursor-pointer ${
                            opt.id === value
                              ? 'bg-[#C96F4A]/5 dark:bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E]'
                              : 'text-[#2B2320] dark:text-[#FAF6F0]'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {opt.id === value && <Check className="w-3.5 h-3.5 text-[#C96F4A] dark:text-[#E0855E] shrink-0 ml-2" />}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
