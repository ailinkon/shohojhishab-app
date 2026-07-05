/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Info, Copy, Check, CornerDownRight, RotateCcw, Star } from 'lucide-react';
import { Language, RegionId } from '../types';
import { REGIONS, LAND_UNITS, TRANSLATIONS } from '../constants';
import { formatValue, getTraditionalBreakdown, translateBengaliToEnglishDigits, isMathExpression, evaluateMathExpression, sanitizeInputString, parseSanitizedNumber } from '../utils';
import BottomSheet from './BottomSheet';
import CalculatorSheet from './CalculatorSheet';
import SearchableSelect from './SearchableSelect';

interface LandConverterTabProps {
  lang: Language;
  useBengaliDigits: boolean;
  setUseBengaliDigits: (val: boolean) => void;
  showToast: (msg: string) => void;
}

export default function LandConverterTab({
  lang,
  useBengaliDigits,
  setUseBengaliDigits,
  showToast,
}: LandConverterTabProps) {
  const t = TRANSLATIONS[lang];

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('land_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('land_favorites', JSON.stringify(favorites));
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

  // Component States
  const [selectedRegion, setSelectedRegion] = useState<RegionId>('dhaka');
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>('shotok');
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  const currentRegion = REGIONS.find(r => r.id === selectedRegion) || REGIONS[0];

  const favoritedUnits = currentRegion.allowedUnits.filter(uId => favorites.includes(uId));
  const otherUnits = currentRegion.allowedUnits.filter(uId => !favorites.includes(uId));

  const searchableOptions = currentRegion.allowedUnits.map((uId) => {
    const u = LAND_UNITS[uId];
    if (!u) return { id: uId, label: uId, isFav: false };
    const nameStr = lang === 'en' ? u.nameEn : u.nameBn;
    const secondaryStr = lang === 'en' ? ` (${u.nameBn})` : ` (${u.nameEn})`;
    return {
      id: uId,
      label: `${nameStr}${secondaryStr}`,
      secondaryLabel: lang === 'en' ? u.nameBn : u.nameEn,
      isFav: favorites.includes(uId),
    };
  });

  // Auto-correct fromUnit if it is not allowed in the new region
  useEffect(() => {
    if (!currentRegion.allowedUnits.includes(fromUnit)) {
      // Default to standard or first allowed unit
      if (currentRegion.allowedUnits.includes('shotok')) {
        setFromUnit('shotok');
      } else {
        setFromUnit(currentRegion.allowedUnits[0]);
      }
    }
  }, [selectedRegion, currentRegion, fromUnit]);

  // Parse input securely, handling math expressions and Bengali digits
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

  // Check if negative
  const isNegative = isExpr
    ? (!isNaN(parsedValue) && parsedValue < 0)
    : translateBengaliToEnglishDigits(inputValue).trim().startsWith('-');

  // Calculate base value in square feet
  let baseSqft = 0;
  if (!isNaN(parsedValue) && parsedValue > 0 && !isNegative) {
    const unitDef = LAND_UNITS[fromUnit];
    if (unitDef) {
      baseSqft = parsedValue * unitDef.factor;
    }
  }

  // Handle Input Changes
  const handleInputChange = (val: string) => {
    const sanitized = sanitizeInputString(val, false, true);
    setInputValue(sanitized);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      showToast(t.copySuccess);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleReset = () => {
    setInputValue('1');
  };

  return (
    <div className="space-y-5">
      {/* 1. REGION SELECTOR (Must come first) */}
      <div className="bg-[#FFFDF9] dark:bg-[#2D2421] p-4 rounded-2xl shadow-sm border border-[#C96F4A]/10">
        <label
          htmlFor="region-selector"
          className="block text-xs font-bold text-[#C96F4A] dark:text-[#E0855E] uppercase tracking-wider mb-2"
        >
          {lang === 'en' ? 'Select your region' : 'আপনার অঞ্চল নির্বাচন করুন'}
        </label>
        <div className="flex items-center gap-2">
          <select
            id="region-selector"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value as RegionId)}
            className="flex-1 min-h-[48px] px-3 bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320] dark:text-[#FAF6F0] rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C96F4A] font-medium text-sm"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {lang === 'en' ? r.nameEn : r.nameBn}
              </option>
            ))}
          </select>
          <button
            id="region-info-btn"
            onClick={() => setIsInfoOpen(true)}
            className="p-3 bg-[#FAF6F0] dark:bg-[#221B19] hover:bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] rounded-xl border border-gray-200 dark:border-gray-800 transition-colors"
            title={t.details}
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. INPUT & FROM UNIT SELECTOR */}
      <div className="bg-[#FFFDF9] dark:bg-[#2D2421] p-5 rounded-2xl shadow-sm border border-[#C96F4A]/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="land-input-field"
              className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
            >
              {lang === 'en' ? 'Enter Value' : 'মান লিখুন'}
            </label>
            <div className="relative">
              <input
                id="land-input-field"
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
                    id="land-reset-btn"
                    onClick={handleReset}
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

          <div>
            <label
              htmlFor="from-unit-selector"
              className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
            >
              {lang === 'en' ? 'From Unit' : 'উৎস ইউনিট'}
            </label>
            <div className="flex gap-2">
              <SearchableSelect
                id="from-unit-selector"
                value={fromUnit}
                onChange={(val) => setFromUnit(val)}
                options={searchableOptions}
                lang={lang}
              />

              <button
                type="button"
                onClick={() => toggleFavorite(fromUnit)}
                className={`p-3 rounded-xl border min-h-[48px] w-[48px] flex items-center justify-center transition-all cursor-pointer ${
                  favorites.includes(fromUnit)
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                    : 'bg-[#FAF6F0] dark:bg-[#221B19] text-gray-400 border-gray-200 dark:border-gray-800 hover:text-amber-500 hover:bg-[#FAF6F0]/80'
                }`}
                title={lang === 'en' ? 'Favorite this unit' : 'পছন্দের তালিকায় রাখুন'}
              >
                <Star className={`w-5 h-5 ${favorites.includes(fromUnit) ? 'fill-amber-500 text-amber-500' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Validation Check for Negative Values */}
        {isNegative && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 text-xs font-medium">
            ⚠️ {t.noNegative}
          </div>
        )}

        {/* Quick Bengali/English numbers toggler */}
        <div className="flex items-center justify-between pt-2 border-t border-[#FAF6F0]/80 dark:border-[#221B19]/50">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {lang === 'en' ? 'Number Display System' : 'সংখ্যা প্রদর্শনের মাধ্যম'}
          </span>
          <button
            id="digits-toggle-btn"
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

      {/* Conversion Outputs Container */}
      {!isNegative && inputValue.trim() !== '' && !isNaN(parsedValue) && parsedValue > 0 && (
        <div className="space-y-4">
          {/* 3. TRADITIONAL COMPOUND BREAKDOWN CARD */}
          <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF6F0] dark:from-[#2D2421] dark:to-[#221B19] p-5 rounded-3xl border-2 border-[#C96F4A]/30 dark:border-[#C96F4A]/50 shadow-md relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10 select-none pointer-events-none">
              <span className="text-7xl font-bold">🌾</span>
            </div>

            <h4 className="text-[#C96F4A] dark:text-[#E0855E] text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <span>🌾</span> {t.compoundFormat}
            </h4>

            <p className="text-lg md:text-xl font-extrabold text-[#2B2320] dark:text-[#FAF6F0] tracking-tight leading-relaxed">
              {getTraditionalBreakdown(baseSqft, selectedRegion, useBengaliDigits, lang)}
            </p>

            <div className="mt-3 pt-3 border-t border-[#C96F4A]/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                {lang === 'en'
                  ? `Calculated from ${formatValue(parsedValue, true, useBengaliDigits)} ${LAND_UNITS[fromUnit]?.nameEn || ''}`
                  : `হিসাবকৃত উৎস: ${formatValue(parsedValue, true, useBengaliDigits)} ${LAND_UNITS[fromUnit]?.nameBn || ''}`}
              </span>
              <button
                id="copy-compound-btn"
                onClick={() =>
                  handleCopy(
                    getTraditionalBreakdown(baseSqft, selectedRegion, false, 'en') +
                      ' | ' +
                      getTraditionalBreakdown(baseSqft, selectedRegion, true, 'bn'),
                    'compound'
                  )
                }
                className="p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-800/50 text-[#C96F4A] dark:text-[#E0855E] transition-colors flex items-center gap-1 text-[11px]"
              >
                {copiedId === 'compound' ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === 'compound' ? (lang === 'en' ? 'Copied' : 'কপি হয়েছে') : (lang === 'en' ? 'Copy All' : 'সব কপি')}</span>
              </button>
            </div>
          </div>

          {/* 4. CONVERT TO ALL UNITS LIST */}
          <div className="bg-[#FFFDF9] dark:bg-[#2D2421] rounded-2xl shadow-sm border border-[#C96F4A]/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-[#FAF6F0] dark:border-[#221B19]/50 flex justify-between items-center bg-[#FAF6F0]/20">
              <h4 className="text-sm font-bold text-[#2B2320] dark:text-[#FAF6F0]">
                {t.convertToAll}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {lang === 'en' ? 'Based on Region' : 'বাছাইকৃত অঞ্চল ভিত্তি'}
              </span>
            </div>

            <div className="divide-y divide-[#FAF6F0] dark:divide-[#221B19]/50">
              {[...currentRegion.allowedUnits]
                .sort((a, b) => {
                  const aFav = favorites.includes(a);
                  const bFav = favorites.includes(b);
                  if (aFav && !bFav) return -1;
                  if (!aFav && bFav) return 1;
                  return 0;
                })
                .map((uId) => {
                  const u = LAND_UNITS[uId];
                  if (!u) return null;

                  // Conversion math: baseSqft / u.factor
                  const convertedValue = baseSqft / u.factor;
                  const formattedVal = formatValue(convertedValue, true, useBengaliDigits, 4);
                  const unitLabel = lang === 'en' ? u.nameEn : u.nameBn;

                  const isCurrentFromUnit = uId === fromUnit;
                  const isFav = favorites.includes(uId);

                  return (
                    <div
                      key={uId}
                      className={`flex items-center justify-between p-4 transition-colors ${
                        isCurrentFromUnit
                          ? 'bg-[#C96F4A]/5 dark:bg-[#C96F4A]/10 font-medium'
                          : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/10'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <CornerDownRight className="w-4 h-4 text-[#C96F4A] mt-1 shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-bold tracking-wide uppercase flex items-center gap-1">
                            {isFav && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                            {unitLabel}
                          </p>
                          <p className="text-base font-extrabold text-[#2B2320] dark:text-[#FAF6F0] tracking-tight mt-0.5 select-all">
                            {formattedVal}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(uId)}
                          className={`p-2 rounded-full hover:bg-amber-500/10 transition-all cursor-pointer ${
                            isFav ? 'text-amber-500' : 'text-gray-300 dark:text-gray-600 hover:text-amber-500'
                          }`}
                          title={lang === 'en' ? 'Favorite' : 'পছন্দের তালিকা'}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-500' : ''}`} />
                        </button>

                        <button
                          id={`copy-land-unit-btn-${uId}`}
                          onClick={() => handleCopy(`${formattedVal} ${unitLabel}`, uId)}
                          className={`p-2.5 rounded-full hover:bg-[#FAF6F0] dark:hover:bg-[#221B19] transition-all cursor-pointer ${
                            isCurrentFromUnit ? 'text-gray-400' : 'text-[#C96F4A] dark:text-[#E0855E]'
                          }`}
                          title={t.copySuccess}
                        >
                          {copiedId === uId ? (
                            <Check className="w-4 h-4 text-green-500 animate-scale-in" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Fallback state when input is empty or zero */}
      {(isNegative || inputValue.trim() === '' || isNaN(parsedValue) || parsedValue <= 0) && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#FFFDF9]/60 dark:bg-[#2D2421]/60 rounded-2xl border-2 border-dashed border-[#FAF6F0] dark:border-gray-800">
          <span className="text-4xl mb-3">📐</span>
          <p className="text-sm font-bold text-[#2B2320]/75 dark:text-[#FAF6F0]/75">
            {lang === 'en' ? 'Awaiting your measurement' : 'হিসাব শুরু করতে মান লিখুন'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mt-1">
            {lang === 'en'
              ? 'Enter any non-zero land area above to see immediate multi-unit conversion and traditional breakdown reports.'
              : 'আঞ্চলিক পরিমাপ এবং ঐতিহ্যগত বিঘা-কাঠা-ছটাক বা কানি-গণ্ডার খতিয়ান রূপান্তর করতে উপরে যেকোনো সঠিক সংখ্যা লিখুন।'}
          </p>
        </div>
      )}

      {/* 5. REGIONAL FORMULAS BOTTOM SHEET */}
      <BottomSheet
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title={lang === 'en' ? 'Region reference factors' : 'আঞ্চলিক হিসাবের সঠিক মান'}
        lang={lang}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#C96F4A] dark:text-[#E0855E] font-bold uppercase tracking-wider">
            {lang === 'en' ? 'Selected Region:' : 'নির্বাচিত অঞ্চল:'} {lang === 'en' ? currentRegion.nameEn : currentRegion.nameBn}
          </p>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'en'
              ? 'Land units are defined relative to the international standard of Square Feet (sq ft). Below are the exact factors used in this application:'
              : 'জমি কনভার্টারের সকল হিসাব আন্তর্জাতিক মান বর্গফুট (sq ft) একককে ভিত্তি ধরে হিসেব করা হয়েছে। নিচে ব্যবহৃত প্রতিটি এককের সঠিক সূত্র দেওয়া হলো:'}
          </p>

          <div className="bg-[#FAF6F0] dark:bg-[#221B19] rounded-xl p-4 space-y-2 border border-gray-200/50 dark:border-gray-800">
            {/* Universal Units section */}
            <h5 className="font-bold text-xs text-[#2B2320] dark:text-[#FAF6F0] border-b border-gray-300 dark:border-gray-700 pb-1.5 mb-2 uppercase tracking-wide">
              {lang === 'en' ? 'Universal Units' : 'সার্বজনীন পরিমাপ'}
            </h5>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="text-gray-600 dark:text-gray-400 font-medium">1 Sq Foot</span>
              <span className="font-bold text-right text-[#2B2320] dark:text-[#FAF6F0]">1.0 sq ft</span>

              <span className="text-gray-600 dark:text-gray-400 font-medium">1 Sq Meter</span>
              <span className="font-bold text-right text-[#2B2320] dark:text-[#FAF6F0]">10.7639 sq ft</span>

              <span className="text-gray-600 dark:text-gray-400 font-medium">1 Acre</span>
              <span className="font-bold text-right text-[#2B2320] dark:text-[#FAF6F0]">43,560 sq ft</span>

              <span className="text-gray-600 dark:text-gray-400 font-medium">1 Hectare</span>
              <span className="font-bold text-right text-[#2B2320] dark:text-[#FAF6F0]">107,639.104 sq ft</span>

              <span className="text-gray-600 dark:text-gray-400 font-medium">1 Shotok / Decimal</span>
              <span className="font-bold text-right text-[#2B2320] dark:text-[#FAF6F0]">435.6 sq ft</span>

              <span className="text-gray-600 dark:text-gray-400 font-medium">1 Ojutangsho</span>
              <span className="font-bold text-right text-[#2B2320] dark:text-[#FAF6F0]">4.356 sq ft (1/100 shotok)</span>
            </div>
          </div>

          <div className="bg-[#FAF6F0] dark:bg-[#221B19] rounded-xl p-4 space-y-2 border border-gray-200/50 dark:border-gray-800">
            {/* Regional Units section */}
            <h5 className="font-bold text-xs text-[#2B2320] dark:text-[#FAF6F0] border-b border-gray-300 dark:border-gray-700 pb-1.5 mb-2 uppercase tracking-wide">
              {lang === 'en' ? 'Regional Specifics' : 'আঞ্চলিক নির্দিষ্ট মানসমূহ'}
            </h5>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              {currentRegion.allowedUnits
                .filter((uId) => !['sqft', 'sqm', 'acre', 'hectare', 'shotok', 'ojutangsho'].includes(uId))
                .map((uId) => {
                  const u = LAND_UNITS[uId];
                  if (!u) return null;
                  return (
                    <div key={uId} className="contents">
                      <span className="text-gray-600 dark:text-gray-400 font-medium">
                        1 {lang === 'en' ? u.nameEn : u.nameBn}
                      </span>
                      <span className="font-bold text-right text-[#2B2320] dark:text-[#FAF6F0]">
                        {formatValue(u.factor, true, useBengaliDigits, 2)} sq ft
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </BottomSheet>

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
