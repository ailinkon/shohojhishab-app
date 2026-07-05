/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, ArrowRightLeft, RefreshCw, AlertTriangle, ExternalLink, RotateCcw } from 'lucide-react';
import { Language, CurrencyInfo } from '../types';
import { FEATURED_CURRENCIES, OTHER_CURRENCIES, FALLBACK_CURRENCY_RATES, TRANSLATIONS } from '../constants';
import { formatValue, translateBengaliToEnglishDigits, sanitizeInputString, parseSanitizedNumber } from '../utils';

// Global cache to avoid double-fetching during tab swaps
let cachedRates: Record<string, number> | null = null;
let cachedDateStr: string | null = null;

interface CurrencyConverterTabProps {
  lang: Language;
  useBengaliDigits: boolean;
  setUseBengaliDigits: (val: boolean) => void;
  showToast: (msg: string) => void;
}

export default function CurrencyConverterTab({
  lang,
  useBengaliDigits,
  setUseBengaliDigits,
  showToast,
}: CurrencyConverterTabProps) {
  const t = TRANSLATIONS[lang];

  // Selected currencies
  const [fromCurrency, setFromCurrency] = useState<string>('AUD');
  const [toCurrency, setToCurrency] = useState<string>('BDT');
  const [inputValue, setInputValue] = useState<string>('100');

  // API rate states
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_CURRENCY_RATES);
  const [ratesDate, setRatesDate] = useState<string>('2026-07-01');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Combine featured and remaining currencies
  const featuredCodes = FEATURED_CURRENCIES.map(c => c.code);
  const allCurrenciesList: CurrencyInfo[] = [
    ...FEATURED_CURRENCIES,
    ...OTHER_CURRENCIES.filter(c => !featuredCodes.includes(c.code)),
  ];

  // Live Rates Fetcher
  const fetchRates = async () => {
    if (isFetching) return;
    setIsFetching(true);
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      if (data && data.rates) {
        setRates(data.rates);
        // Clean date string extraction (YYYY-MM-DD or readable part)
        let datePart = '2026-07-02';
        if (data.time_last_update_utc) {
          const parsedDate = new Date(data.time_last_update_utc);
          if (!isNaN(parsedDate.getTime())) {
            datePart = parsedDate.toISOString().split('T')[0];
          } else {
            datePart = String(data.time_last_update_utc).slice(0, 16);
          }
        }
        setRatesDate(datePart);
        setIsOffline(false);

        // Store in global cache
        cachedRates = data.rates;
        cachedDateStr = datePart;
      }
    } catch (error) {
      console.warn('Currency fetch failed, using fallback offline rates:', error);
      setIsOffline(true);
      // Fallback to cache if available
      if (cachedRates) {
        setRates(cachedRates);
        if (cachedDateStr) setRatesDate(cachedDateStr);
      } else {
        setRates(FALLBACK_CURRENCY_RATES);
        setRatesDate('2026-07-01');
      }
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (cachedRates) {
      setRates(cachedRates);
      if (cachedDateStr) setRatesDate(cachedDateStr);
    } else {
      fetchRates();
    }
  }, []);

  const [swapRotation, setSwapRotation] = useState(0);
  const [pulse, setPulse] = useState(false);

  // Trigger pulse animation when conversion inputs or currencies change (performing conversion)
  useEffect(() => {
    const parsed = parseSanitizedNumber(inputValue);
    if (inputValue.trim() !== '' && !isNaN(parsed)) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 150);
      return () => clearTimeout(timer);
    }
  }, [inputValue, fromCurrency, toCurrency]);

  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    setSwapRotation(prev => prev + 180);
  };

  // Quick pairs
  const handleQuickPair = (from: string, to: string) => {
    setFromCurrency(from);
    setToCurrency(to);
  };

  const handleInputChange = (val: string) => {
    const sanitized = sanitizeInputString(val, false, false);
    setInputValue(sanitized);
  };

  const parsedValue = parseSanitizedNumber(inputValue);

  let convertedResult = 0;
  let singleRate = 0;
  const hasValidValue = !isNaN(parsedValue) && parsedValue > 0;

  if (rates[fromCurrency] && rates[toCurrency]) {
    const rateFromUSD = rates[fromCurrency];
    const rateToUSD = rates[toCurrency];

    // Conversion rate of From -> To (To / From)
    singleRate = rateToUSD / rateFromUSD;

    if (hasValidValue) {
      convertedResult = (parsedValue / rateFromUSD) * rateToUSD;
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast(t.copySuccess);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const fromInfo = allCurrenciesList.find(c => c.code === fromCurrency);
  const toInfo = allCurrenciesList.find(c => c.code === toCurrency);

  const fromSymbol = fromInfo?.symbol || '';
  const toSymbol = toInfo?.symbol || '';

  const fromName = fromInfo ? (lang === 'en' ? fromInfo.nameEn : fromInfo.nameBn) : '';
  const toName = toInfo ? (lang === 'en' ? toInfo.nameEn : toInfo.nameBn) : '';

  // South Asian formatting for BDT and INR, otherwise Standard
  const useSouthAsianGrouping = toCurrency === 'BDT' || toCurrency === 'INR' || fromCurrency === 'BDT' || fromCurrency === 'INR';

  const formattedInput = formatValue(parsedValue, useSouthAsianGrouping, useBengaliDigits, 2);
  const formattedResult = formatValue(convertedResult, useSouthAsianGrouping, useBengaliDigits, 2);
  const formattedSingleRate = formatValue(singleRate, false, useBengaliDigits, 4);

  const copyString = `${formattedInput} ${fromCurrency} = ${formattedResult} ${toCurrency} (Rate: ${formattedSingleRate})`;

  return (
    <div className="space-y-5">
      {/* 1. RATES STATUS INDICATOR & OFFLINE BANNER */}
      {isOffline ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-amber-800 dark:text-amber-400">
              {t.offlineBanner} {ratesDate}
            </p>
            <p className="text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              {lang === 'en'
                ? 'Device offline or API rate limit reached. All conversions are active using cached rates.'
                : 'ডিভাইস অফলাইন অথবা এপিআই লিমিট শেষ হয়েছে। পূর্বের সংরক্ষিত রেট দিয়ে হিসেব করা হচ্ছে।'}
            </p>
          </div>
          <button
            id="refresh-rates-btn"
            onClick={fetchRates}
            disabled={isFetching}
            className="p-1 text-amber-700 hover:text-amber-900 disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="bg-[#FFFDF9]/60 dark:bg-[#2D2421]/60 px-4 py-2.5 rounded-2xl border border-[#C96F4A]/5 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>
              {t.ratesUpdated} <b className="font-bold text-[#2B2320] dark:text-[#FAF6F0]">{ratesDate}</b>
            </span>
          </div>
          <button
            id="force-refresh-rates-btn"
            onClick={fetchRates}
            disabled={isFetching}
            className="p-1 text-[#C96F4A] hover:text-[#C96F4A]/80 disabled:opacity-50 flex items-center gap-1 font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>{isFetching ? (lang === 'en' ? 'Updating' : 'আপডেট হচ্ছে') : (lang === 'en' ? 'Refresh' : 'রিফ্রেশ')}</span>
          </button>
        </div>
      )}

      {/* 2. CORE CALCULATOR PANEL */}
      <div className="bg-[#FFFDF9] dark:bg-[#2D2421] p-5 rounded-2xl shadow-sm border border-[#C96F4A]/10 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Amount input */}
          <div>
            <label
              htmlFor="currency-input-field"
              className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
            >
              {lang === 'en' ? 'Send Amount' : 'পাঠানোর পরিমাণ'}
            </label>
            <div className="relative">
              <input
                id="currency-input-field"
                type="text"
                inputMode="decimal"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={lang === 'en' ? '100' : '১০০'}
                className="w-full min-h-[48px] pl-4 pr-10 bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320] dark:text-[#FAF6F0] rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C96F4A] font-bold text-lg"
              />
              {inputValue && (
                <button
                  id="currency-reset-btn"
                  onClick={() => setInputValue('100')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Currencies Dropdowns with Swap */}
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="from-currency-select"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
              >
                {t.fromUnit}
              </label>
              <select
                id="from-currency-select"
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="w-full min-h-[48px] px-2 bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320] dark:text-[#FAF6F0] rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C96F4A] font-bold text-sm"
              >
                {allCurrenciesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {lang === 'en' ? c.nameEn : c.nameBn}
                  </option>
                ))}
              </select>
            </div>

            {/* SWAP BUTTON */}
            <motion.button
              id="currency-swap-btn"
              onClick={handleSwap}
              animate={{ rotate: swapRotation, scale: pulse ? 1.15 : 1 }}
              whileHover={{ scale: pulse ? 1.15 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{
                rotate: { type: 'spring', stiffness: 220, damping: 14 },
                scale: { type: 'spring', stiffness: 350, damping: 12 }
              }}
              className="p-3 bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] hover:bg-[#C96F4A] hover:text-white rounded-xl min-h-[48px] flex items-center justify-center shrink-0 border border-[#C96F4A]/20 cursor-pointer"
              title={lang === 'en' ? 'Swap Currencies' : 'কারেন্সি বদলান'}
            >
              <ArrowRightLeft className="w-4 h-4 rotate-90 md:rotate-0" />
            </motion.button>

            <div className="flex-1">
              <label
                htmlFor="to-currency-select"
                className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5"
              >
                {t.toUnit}
              </label>
              <select
                id="to-currency-select"
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="w-full min-h-[48px] px-2 bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320] dark:text-[#FAF6F0] rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-[#C96F4A] font-bold text-sm"
              >
                {allCurrenciesList.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} - {lang === 'en' ? c.nameEn : c.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 3. QUICK CORRIDORS REMITTANCE ROW */}
        <div className="pt-2 border-t border-[#FAF6F0]/80 dark:border-[#221B19]/50 space-y-2">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
            ⚡ {t.quickCorridors}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { from: 'AUD', to: 'BDT', flag: '🇦🇺' },
              { from: 'USD', to: 'BDT', flag: '🇺🇸' },
              { from: 'SAR', to: 'BDT', flag: '🇸🇦' },
              { from: 'AED', to: 'BDT', flag: '🇦🇪' },
              { from: 'GBP', to: 'BDT', flag: '🇬🇧' },
              { from: 'INR', to: 'BDT', flag: '🇮🇳' },
            ].map((pair) => {
              const isActive = fromCurrency === pair.from && toCurrency === pair.to;
              return (
                <button
                  key={`${pair.from}-${pair.to}`}
                  id={`pair-chip-${pair.from}-${pair.to}`}
                  onClick={() => handleQuickPair(pair.from, pair.to)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all flex items-center gap-1 border ${
                    isActive
                      ? 'bg-[#C96F4A] text-white border-[#C96F4A] shadow-sm'
                      : 'bg-[#FAF6F0] dark:bg-[#221B19] text-[#2B2320]/80 dark:text-[#FAF6F0]/80 border-gray-200 dark:border-gray-850 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <span>{pair.flag}</span>
                  <span>{pair.from}➔{pair.to}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Digit System Selector */}
        <div className="flex items-center justify-between pt-2 border-t border-[#FAF6F0]/80 dark:border-[#221B19]/50">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {lang === 'en' ? 'Number Display System' : 'সংখ্যা প্রদর্শনের মাধ্যম'}
          </span>
          <button
            id="currency-digits-toggle"
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

      {/* 4. VISUAL CONVERSION CARD */}
      {hasValidValue && (
        <div className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF6F0] dark:from-[#2D2421] dark:to-[#221B19] p-6 rounded-3xl border-2 border-[#C96F4A]/30 dark:border-[#C96F4A]/50 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 select-none pointer-events-none text-7xl">
            💱
          </div>

          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-[#C96F4A] dark:text-[#E0855E] uppercase tracking-wider mb-2">
                {lang === 'en' ? 'Receiving Amount' : 'গ্রহীতার প্রাপ্ত পরিমাণ'}
              </p>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-4xl font-extrabold text-[#2B2320] dark:text-[#FAF6F0] tracking-tight">
                  {toSymbol} {formattedResult}
                </span>
                <span className="text-sm font-extrabold text-gray-500 bg-gray-100 dark:bg-gray-850 px-2 py-0.5 rounded">
                  {toCurrency}
                </span>
              </div>

              {/* Conversion logic trace line */}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 font-medium">
                {fromSymbol} {formattedInput} {fromCurrency} ➔ {toSymbol} {formattedResult} {toCurrency}
              </p>

              {/* Instant rate factor */}
              <div className="mt-3 inline-flex items-center gap-1 px-2 py-1 bg-white/60 dark:bg-[#221B19]/50 rounded-lg border border-[#C96F4A]/5 text-[11px] text-[#2B2320]/80 dark:text-[#FAF6F0]/80">
                <span className="font-bold">1 {fromCurrency} =</span>
                <span className="font-extrabold text-[#C96F4A] dark:text-[#E0855E]">{formattedSingleRate}</span>
                <span>{toCurrency}</span>
              </div>
            </div>

            <button
              id="copy-currency-result"
              onClick={() => handleCopy(copyString)}
              className="p-3 rounded-2xl bg-white dark:bg-[#221B19] hover:bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] border border-gray-100 dark:border-gray-800 shadow-sm transition-all active:scale-90 shrink-0"
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

      {/* Awaiting input fallbacks */}
      {!hasValidValue && (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-[#FFFDF9]/60 dark:bg-[#2D2421]/60 rounded-2xl border-2 border-dashed border-[#FAF6F0] dark:border-gray-800">
          <span className="text-4xl mb-3">💱</span>
          <p className="text-sm font-bold text-[#2B2320]/75 dark:text-[#FAF6F0]/75">
            {lang === 'en' ? 'Awaiting Send Amount' : 'পাঠানোর পরিমাণ লিখুন'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mt-1">
            {lang === 'en'
              ? 'Enter any send amount above to estimate instant international transfers and mid-market corridors.'
              : 'রেমিট্যান্স বা বৈশ্বিক মুদ্রার সমপরিমাণ হিসাব মেলাতে উপরে সঠিক সংখ্যা টাইপ করুন।'}
          </p>
        </div>
      )}

      {/* 5. SOFT INFO DISCLAIMER CARD WITH LINK */}
      <div className="bg-[#FAF6F0]/60 dark:bg-[#221B19]/30 p-4 rounded-2xl border border-[#C96F4A]/10 space-y-3">
        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          ℹ️ {t.midMarketDisclaimer}
        </div>
        <div className="pt-1 flex">
          <a
            id="taptapsend-link"
            href="https://www.taptapsend.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-[#2D2421] hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-[#C96F4A] dark:text-[#E0855E] rounded-xl border border-gray-100 dark:border-gray-850 transition-all shadow-sm group"
          >
            <span>{t.compareTaptap}</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
