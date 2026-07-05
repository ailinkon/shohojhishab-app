/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Delete, X } from 'lucide-react';
import { Language } from '../types';
import { formatValue, evaluateMathExpression, translateBengaliToEnglishDigits, sanitizeInputString } from '../utils';
import BottomSheet from './BottomSheet';

interface CalculatorSheetProps {
  lang: Language;
  useBengaliDigits: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUseResult: (result: string) => void;
  initialValue: string;
}

const CALC_TRANSLATIONS = {
  en: {
    title: 'Calculator',
    useResult: 'Use Result',
    clear: 'Clear',
    placeholder: '0',
  },
  bn: {
    title: 'ক্যালকুলেটর',
    useResult: 'ফলাফল ব্যবহার করুন',
    clear: 'পরিষ্কার',
    placeholder: '০',
  }
};

const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export default function CalculatorSheet({
  lang,
  useBengaliDigits,
  isOpen,
  onClose,
  onUseResult,
  initialValue,
}: CalculatorSheetProps) {
  const t = CALC_TRANSLATIONS[lang];
  const [expression, setExpression] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial value when sheet opens
  useEffect(() => {
    if (isOpen) {
      setExpression(initialValue || '');
      // Auto focus input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, initialValue]);

  // Live calculation
  let liveResult: string = '';
  const parsed = evaluateMathExpression(expression);
  if (parsed !== null) {
    if (parsed === Infinity || parsed === -Infinity) {
      liveResult = '—';
    } else {
      liveResult = formatValue(parsed, false, useBengaliDigits, 4);
    }
  }

  const handleKeyPress = (char: string) => {
    setExpression((prev) => prev + char);
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setExpression('');
  };

  const handleUseResult = () => {
    if (parsed !== null && isFinite(parsed)) {
      // Pass formatted result back
      const finalVal = formatValue(parsed, false, useBengaliDigits, 4);
      onUseResult(finalVal);
      onClose();
    }
  };

  // Maps display characters depending on language/digits toggle
  const getDigitLabel = (num: number) => {
    return useBengaliDigits ? BENGALI_DIGITS[num] : ENGLISH_DIGITS[num];
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={t.title} lang={lang}>
      <div className="space-y-4">
        {/* DISPLAY SECTION */}
        <div className="bg-[#FAF6F0] dark:bg-[#1E1716] p-4 rounded-2xl border border-gray-200/50 dark:border-gray-800/80 flex flex-col justify-between min-h-[96px] relative">
          {/* Main expression input field */}
          <input
            ref={inputRef}
            type="text"
            value={expression}
            onChange={(e) => {
              const val = e.target.value;
              const sanitized = sanitizeInputString(val, true, true);
              setExpression(sanitized);
            }}
            className="w-full text-right bg-transparent text-xl font-bold border-none focus:outline-none focus:ring-0 text-[#2B2320] dark:text-[#FAF6F0] p-0 pr-1"
            placeholder={t.placeholder}
          />

          {/* Live Output indicator */}
          <div className="text-right text-sm font-semibold text-gray-400 dark:text-gray-500 min-h-[20px] pr-1 mt-1">
            {liveResult && (
              <span className="text-[#8FA98F] dark:text-[#A7C0A7] text-lg font-bold">
                = {liveResult}
              </span>
            )}
          </div>
        </div>

        {/* KEYPAD GRID */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button
            onClick={() => handleKeyPress('(')}
            className="h-12 bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-base flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
          >
            (
          </button>
          <button
            onClick={() => handleKeyPress(')')}
            className="h-12 bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-base flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
          >
            )
          </button>
          <button
            onClick={handleClear}
            className="h-12 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-500 dark:text-red-400 rounded-xl font-bold text-sm flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
          >
            C
          </button>
          <button
            onClick={handleBackspace}
            className="h-12 bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-800 text-[#C96F4A] dark:text-[#E0855E] rounded-xl font-bold text-base flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleKeyPress(getDigitLabel(7))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(7)}
          </button>
          <button
            onClick={() => handleKeyPress(getDigitLabel(8))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(8)}
          </button>
          <button
            onClick={() => handleKeyPress(getDigitLabel(9))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(9)}
          </button>
          <button
            onClick={() => handleKeyPress('÷')}
            className="h-12 bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] hover:bg-[#C96F4A]/20 rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
          >
            ÷
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleKeyPress(getDigitLabel(4))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(4)}
          </button>
          <button
            onClick={() => handleKeyPress(getDigitLabel(5))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(5)}
          </button>
          <button
            onClick={() => handleKeyPress(getDigitLabel(6))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(6)}
          </button>
          <button
            onClick={() => handleKeyPress('×')}
            className="h-12 bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] hover:bg-[#C96F4A]/20 rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
          >
            ×
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleKeyPress(getDigitLabel(1))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(1)}
          </button>
          <button
            onClick={() => handleKeyPress(getDigitLabel(2))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(2)}
          </button>
          <button
            onClick={() => handleKeyPress(getDigitLabel(3))}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(3)}
          </button>
          <button
            onClick={() => handleKeyPress('−')}
            className="h-12 bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] hover:bg-[#C96F4A]/20 rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
          >
            −
          </button>

          {/* Row 5 */}
          <button
            onClick={() => handleKeyPress(getDigitLabel(0))}
            className="col-span-2 h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            {getDigitLabel(0)}
          </button>
          <button
            onClick={() => handleKeyPress('.')}
            className="h-12 bg-white dark:bg-gray-800/20 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#2B2320] dark:text-[#FAF6F0] rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer shadow-sm border border-gray-100 dark:border-transparent transition-colors active:scale-95 duration-100"
          >
            .
          </button>
          <button
            onClick={() => handleKeyPress('+')}
            className="h-12 bg-[#C96F4A]/10 text-[#C96F4A] dark:text-[#E0855E] hover:bg-[#C96F4A]/20 rounded-xl font-bold text-lg flex items-center justify-center cursor-pointer transition-colors active:scale-95 duration-100"
          >
            +
          </button>
        </div>

        {/* USE RESULT SUBMIT BUTTON */}
        <button
          onClick={handleUseResult}
          disabled={parsed === null || !isFinite(parsed)}
          className={`w-full min-h-[48px] py-3 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
            parsed !== null && isFinite(parsed)
              ? 'bg-[#C96F4A] text-white hover:bg-[#C96F4A]/90 active:scale-[0.98] cursor-pointer'
              : 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed shadow-none'
          }`}
        >
          <span>{t.useResult}</span>
          {parsed !== null && isFinite(parsed) && (
            <span className="text-xs opacity-80">({liveResult})</span>
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
