/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  lang: Language;
  children: ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  lang,
  children,
}: BottomSheetProps) {
  const t = TRANSLATIONS[lang];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            id="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 pointer-events-auto"
          />

          {/* Bottom Sheet Container */}
          <motion.div
            id="bottom-sheet-container"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#FFFDF9] dark:bg-[#2D2421] rounded-t-[28px] shadow-2xl z-50 max-h-[85vh] flex flex-col pointer-events-auto overflow-hidden border-t border-[#FAF6F0]/20"
          >
            {/* Drag Handle indicator for cozy look */}
            <div className="w-full flex justify-center pt-3 pb-1">
              <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-3 border-b border-[#FAF6F0] dark:border-[#221B19]/50">
              <h3 className="text-lg font-bold text-[#2B2320] dark:text-[#FAF6F0]">
                {title}
              </h3>
              <button
                id="bottom-sheet-close-btn"
                onClick={onClose}
                className="p-2 rounded-full bg-[#FAF6F0] dark:bg-[#221B19] text-[#C96F4A] hover:bg-[#FAF6F0]/80 dark:hover:bg-[#221B19]/80 transition-colors"
                aria-label={t.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="px-6 py-4 overflow-y-auto flex-1 text-[#2B2320] dark:text-[#FAF6F0] text-sm leading-relaxed">
              {children}
            </div>

            {/* Footer Close Button */}
            <div className="p-4 bg-[#FAF6F0]/50 dark:bg-[#221B19]/30 border-t border-[#FAF6F0] dark:border-[#221B19]/50 flex justify-end">
              <button
                id="bottom-sheet-footer-close-btn"
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-[#C96F4A] text-white font-bold text-sm shadow-md hover:bg-[#C96F4A]/90 active:scale-95 transition-all"
              >
                {t.close}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
