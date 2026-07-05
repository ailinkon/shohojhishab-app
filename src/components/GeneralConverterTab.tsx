/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, ArrowRightLeft, RotateCcw, Star } from 'lucide-react';
import { Language, GeneralCategory, UnitDefinition } from '../types';
import { GENERAL_UNITS, TRANSLATIONS } from '../constants';
import { formatValue, translateBengaliToEnglishDigits, isMathExpression, evaluateMathExpression, sanitizeInputString, parseSanitizedNumber } from '../utils';
import CalculatorSheet from './CalculatorSheet';
import SearchableSelect from './SearchableSelect';

interface GeneralConverterTabProps {
  lang: Language;
  useBengaliDigits: boolean;
  setUseBengaliDigits: (val: boolean) => void;
  showToast: (msg: string) => void;
}

export default function GeneralConverterTab({
  lang,
  useBengaliDigits,
  setUseBengaliDigits,
  showToast,
}: GeneralConverterTabProps) {
  const t = TRANSLATIONS[lang];

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('general_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('general_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (uId: string) => {
    setFavorites(prev => {
      const isFav = prev.includes(uId);
      const updated = isFav
        ? prev.filter(id => id !== uId)
        : [...prev, uId];
      showToast(
        lang === 'en'
          ? (isFav ? 'Removed from favorites' : 'Added to favorites')
          : (isFav ? 'পছন্দের তালিকা থেকে সরানো হয়েছে' : 'পছন্দের তালিকায় যোগ করা হয়েছে')
      );
      return updated;
    });
  };

  // Tab state
  const [activeCategory, setActiveCategory] = useState<GeneralCategory>('length');
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('');
  const [toUnit, setToUnit] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  const categories: { id: GeneralCategory; label: string }[] = [
    { id: 'length', label: t.categories.length },
    { id: 'area', label: t.categories.area },
    { id: 'weight', label: t.categories.weight },
    { id: 'temp', label: t.categories.temp },
    { id: 'volume', label: t.categories.volume },
    { id: 'speed', label: t.categories.speed },
    { id: 'time', label: t.categories.time },
    { id: 'data', label: t.categories.data },
  ];

  const currentUnits = GENERAL_UNITS[activeCategory] || [];

  const favoritedUnits = currentUnits.filter(u => favorites.includes(u.id));
  const otherUnits = currentUnits.filter(u => !favorites.includes(u.id));

  const searchableOptions = currentUnits.map((u) => {
    const nameStr = lang === 'en' ? u.nameEn : u.nameBn;
    const symbolStr = u.symbolEn ? ` (${u.symbolEn})` : '';
    return {
      id: u.id,
      label: `${nameStr}${symbolStr}`,
      secondaryLabel: lang === 'en' ? u.nameBn : u.nameEn,
      isFav: favorites.includes(u.id),
    };
  });

  // Whenever category changes, set sensible defaults
  useEffect(() => {
    if (currentUnits.length >= 2) {
      setFromUnit(currentUnits[0].id);
      setToUnit(currentUnits[1].id);
    }
  }, [activeCategory]);

  const [swapRotation, setSwapRotation] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Trigger pulse animation when conversion inputs or units change (performing conversion)
  useEffect(() => {
    const parsed = parseSanitizedNumber(inputValue);
    if (inputValue.trim() !== '' && !isNaN(parsed)) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 150);
      return () => clearTimeout(timer);
    }
  }, [inputValue, fromUnit, toUnit]);

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    setSwapRotation(prev => prev + 180);
  };

  const handleInputChange = (val: string) => {
    const isTemp = activeCategory === 'temp';
    const sanitized = sanitizeInputString(val, isTemp, true);
    setInputValue(sanitized);
  };

  const isExpr = isMathExpression(inputValue);
  let parsedValue = NaN;
  let exprResult: number | null = null;
  if (isExpr) {
    exprResult = evaluateMathExpression(inputValue);
    if (exprResult !== null) {
      parsedValue = exprResult;
    }
  } else {
    parsedValue = parseSanitizedNumber(inputValue);
  }

  const isNegative = isExpr
    ? (!isNaN(parsedValue) && parsedValue < 0)
    : translateBengaliToEnglishDigits(inputValue).trim().startsWith('-');


  const fromUnitDef = currentUnits.find(u => u.id === fromUnit);
  const toUnitDef = currentUnits.find(u => u.id === toUnit);

  // Dedicated temperature converter
  const convertTemp = (val: number, from: string, to: string): number => {
    let celsius = val;
    if (from === 'F') {
      celsius = (val - 32) / 1.8;
    } else if (from === 'K') {
      celsius = val - 273.15;
    }

    if (to === 'C') {
      return celsius;
    } else if (to === 'F') {
      return celsius * 1.8 + 32;
    } else if (to === 'K') {
      return celsius + 273.15;
    }
    return val;
  };

  // Perform core conversion
  let convertedResult = 0;
  let hasValidConversion = false;

  // Temperature allows negative values; other categories reject negative values
  const isInputAllowed = activeCategory === 'temp' ? !isNaN(parsedValue) : (!isNaN(parsedValue) && parsedValue >= 0 && !isNegative);

  if (isInputAllowed && fromUnitDef && toUnitDef) {
    hasValidConversion = true;
    if (activeCategory === 'temp') {
      convertedResult = convertTemp(parsedValue, fromUnit, toUnit);
    } else {
      const valueInBase = parsedValue * fromUnitDef.factor;
      convertedResult = valueInBase / toUnitDef.factor;
    }
  }

  const handleCopyResult = (resultText: string) => {
    navigator.clipboard.writeText(resultText).then(() => {
      setCopied(true);
      showToast(t.copySuccess);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const displayFromSymbol = fromUnitDef
    ? (lang === 'en' ? fromUnitDef.symbolEn : fromUnitDef.symbolBn)
    : '';
  const displayToSymbol = toUnitDef
    ? (lang === 'en' ? toUnitDef.symbolEn : toUnitDef.symbolBn)
    : '';

  const outputFormatted = hasValidConversion
    ? formatValue(convertedResult, false, useBengaliDigits, 4)
    : '';

  const fromLabel = fromUnitDef
    ? (lang === 'en' ? fromUnitDef.nameEn : fromUnitDef.nameBn)
    : '';
  const toLabel = toUnitDef
    ? (lang === 'en' ? toUnitDef.nameEn : toUnitDef.nameBn)
    : '';

  const copyString = hasValidConversion
    ? `${formatValue(parsedValue, false, useBengaliDigits, 4)} ${fromLabel} = ${outputFormatted} ${toLabel}`
    : '';

  return (
    <div className="space-y-5">
      {/* 1. SCROLLABLE CATEGORY CHIPS */}
      <div className="w-full overflow-x-auto pb-1 select-none scrollbar-none flex gap-2">
        {categories.map((cat) => {
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              id={`cat-chip-${cat.id}`}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? 'bg-[#C96F4A] text-[#FFFDF9] shadow-sm scale-105'
                  : 'bg-[#FFFDF9] dark:bg-[#2D2421] text-[#2B2320]/80 dark:text-[#FAF6F0]/80 border border-[#C96F4A]/5 hover:bg-[#FAF6F0] dark:hover:bg-[#221B19]/50'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* 2. CORE CONVERSION PANEL */}
      <div className="bg-[#FFFDF9] dark:bg-[#2D2421] p-5 rounded-2xl shadow-sm border border-[#C96F4A]/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Input field */}
          <div>
            <label
              htmlFor="gen-input-field"
              className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
            >
              {lang === 'en' ? 'Enter Value' : 'মান লিখুন'}
            </label>
            <div className="relative">
              <input
                id="gen-input-field"
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={lang === 'en' ? '0.0' : '০.০'}
                className="w-full min-h-[48px] pl-4 pr-18 bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320] dark:text-[#FAF6F0] rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C96F4A] font-bold text-lg"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsCalcOpen(true)}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-[#C96F4A] dark:hover:text-[#E0855E] transition-colors cursor-pointer"
                  title={lang === 'en' ? 'Open Calculator' : 'ক্যালকুলেটর খুলুন'}
                >
                  <span className="text-base select-none">🖩</span>
                </button>
                {inputValue && (
                  <button
                    id="gen-reset-btn"
                    onClick={() => setInputValue('1')}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            {isExpr && exprResult !== null && (
              <div className="text-xs font-bold text-[#8FA98F] dark:text-[#A7C0A7] mt-1 pr-1 text-right animate-fade-in">
                = {exprResult === Infinity || exprResult === -Infinity
                  ? '—'
                  : formatValue(exprResult, false, useBengaliDigits, 4)}
              </div>
            )}

          </div>

          {/* Combined Source & Destination Unit selections */}
          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <div className="flex-1">
              <label
                htmlFor="gen-from-unit"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
              >
                {t.fromUnit}
              </label>
              <div className="flex gap-1.5">
                <SearchableSelect
                  id="gen-from-unit"
                  value={fromUnit}
                  onChange={(val) => setFromUnit(val)}
                  options={searchableOptions}
                  lang={lang}
                />

                <button
                  type="button"
                  onClick={() => toggleFavorite(fromUnit)}
                  className={`p-2.5 rounded-xl border min-h-[48px] w-[44px] flex items-center justify-center transition-all cursor-pointer ${
                    favorites.includes(fromUnit)
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-[#FAF6F0] dark:bg-[#221B19] text-gray-400 border-gray-200 dark:border-gray-800 hover:text-amber-500 hover:bg-[#FAF6F0]/80'
                  }`}
                  title={lang === 'en' ? 'Favorite this unit' : 'পছন্দের তালিকায় রাখুন'}
                >
                  <Star className={`w-4 h-4 ${favorites.includes(fromUnit) ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
              </div>
            </div>

            {/* SWAP BUTTON */}
            <div className="flex items-center justify-center py-1 md:py-0">
              <motion.button
                id="gen-swap-btn"
                onClick={handleSwap}
                animate={{ rotate: swapRotation, scale: pulse ? 1.15 : 1 }}
                whileHover={{ scale: pulse ? 1.15 : 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  rotate: { type: 'spring', stiffness: 220, damping: 14 },
                  scale: { type: 'spring', stiffness: 350, damping: 12 }
                }}
                className="p-3 bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] hover:bg-[#C96F4A] hover:text-white rounded-xl min-h-[48px] flex items-center justify-center shrink-0 border border-[#C96F4A]/20 cursor-pointer"
                title={lang === 'en' ? 'Swap Units' : 'ইউনিট বদলান'}
              >
                <ArrowRightLeft className="w-4 h-4 rotate-90 md:rotate-0" />
              </motion.button>
            </div>

            <div className="flex-1">
              <label
                htmlFor="gen-to-unit"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
              >
                {t.toUnit}
              </label>
              <div className="flex gap-1.5">
                <SearchableSelect
                  id="gen-to-unit"
                  value={toUnit}
                  onChange={(val) => setToUnit(val)}
                  options={searchableOptions}
                  lang={lang}
                />

                <button
                  type="button"
                  onClick={() => toggleFavorite(toUnit)}
                  className={`p-2.5 rounded-xl border min-h-[48px] w-[44px] flex items-center justify-center transition-all cursor-pointer ${
                    favorites.includes(toUnit)
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-[#FAF6F0] dark:bg-[#221B19] text-gray-400 border-gray-200 dark:border-gray-800 hover:text-amber-500 hover:bg-[#FAF6F0]/80'
                  }`}
                  title={lang === 'en' ? 'Favorite this unit' : 'পছন্দের তালিকায় রাখুন'}
                >
                  <Star className={`w-4 h-4 ${favorites.includes(toUnit) ? 'fill-amber-500 text-amber-500' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Check for Negative values (except Temp) */}
        {activeCategory !== 'temp' && isNegative && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium">
            ⚠️ {t.noNegative}
          </div>
        )}

        {/* Digit System Selector */}
        <div className="flex items-center justify-between pt-2 border-t border-[#FAF6F0]/80 dark:border-[#221B19]/50">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {lang === 'en' ? 'Number Display System' : 'সংখ্যা প্রদর্শনের মাধ্যম'}
          </span>
          <button
            id="gen-digits-toggle"
            onClick={() => setUseBengaliDigits(!useBengaliDigits)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              useBengaliDigits
                ? 'bg-[#C96F4A] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            {useBengaliDigits ? t.bengaliDigits : t.englishDigits}
          </button>
        </div>
      </div>

      {/* 3. VISUAL OUTPUT PANEL */}
      {isInputAllowed && inputValue.trim() !== '' && !isNaN(parsedValue) && (
        <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF6F0] dark:from-[#2D2421] dark:to-[#221B19] p-6 rounded-3xl border-2 border-[#8FA98F]/30 dark:border-[#8FA98F]/50 shadow-md relative overflow-hidden">
          {/* Subtle decoration background */}
          <div className="absolute -bottom-4 -right-4 text-7xl opacity-5 select-none pointer-events-none">
            📏
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#8FA98F] dark:text-[#A7C0A7] uppercase tracking-wider">
                {lang === 'en' ? 'Converted Result' : 'রূপান্তরিত ফলাফল'}
              </p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl md:text-4xl font-extrabold text-[#2B2320] dark:text-[#FAF6F0] tracking-tight select-all">
                  {outputFormatted}
                </span>
                <span className="text-base font-bold text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-gray-800/50 px-2.5 py-0.5 rounded-md">
                  {displayToSymbol || toLabel}
                </span>
              </div>

              {/* Conversion details path */}
              <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                <span>{formatValue(parsedValue, false, useBengaliDigits, 4)}</span>
                <span className="text-gray-300 dark:text-gray-700">{displayFromSymbol || fromLabel}</span>
                <span>➔</span>
                <span className="text-[#C96F4A] dark:text-[#E0855E]">{outputFormatted}</span>
                <span className="text-gray-300 dark:text-gray-700">{displayToSymbol || toLabel}</span>
              </div>
            </div>

            <button
              id="copy-gen-result"
              onClick={() => handleCopyResult(copyString)}
              className="p-3 rounded-2xl bg-white dark:bg-[#221B19] hover:bg-[#8FA98F]/10 text-[#C96F4A] dark:text-[#E0855E] border border-gray-100 dark:border-gray-800 shadow-sm transition-all active:scale-90"
              title={t.copySuccess}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500 animate-scale-in" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Fallback layout when input empty */}
      {(!isInputAllowed || inputValue.trim() === '' || isNaN(parsedValue)) && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#FFFDF9]/60 dark:bg-[#2D2421]/60 rounded-2xl border-2 border-dashed border-[#FAF6F0] dark:border-gray-800">
          <span className="text-4xl mb-3">📐</span>
          <p className="text-sm font-bold text-[#2B2320]/75 dark:text-[#FAF6F0]/75">
            {lang === 'en' ? 'Awaiting Conversion' : 'ইনপুট মান লিখুন'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mt-1">
            {lang === 'en'
              ? 'Enter any numerical measurement value above to convert smoothly across classic and local South Asian categories.'
              : 'দৈনন্দিন পরিমাপ বা দেশীয় তোলা-আউন্স ও হাত-গজের হিসাব মেলাতে উপরে সঠিক সংখ্যা টাইপ করুন।'}
          </p>
        </div>
      )}

      <CalculatorSheet
        lang={lang}
        useBengaliDigits={useBengaliDigits}
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onUseResult={(res) => setInputValue(res)}
        initialValue={inputValue}
      />
    </div>
  );
}

