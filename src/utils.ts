/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Language } from './types';

/**
 * Maps English digits to Bengali digits.
 */
export function formatBengaliNumber(numStr: string): string {
  const englishToBengaliMap: Record<string, string> = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return numStr.split('').map(char => englishToBengaliMap[char] || char).join('');
}

/**
 * Maps Bengali digits to English digits.
 */
export function translateBengaliToEnglishDigits(str: string): string {
  const bToE: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.split('').map(char => bToE[char] || char).join('');
}

/**
 * Formats a number with customizable comma grouping (standard or South Asian Lakh/Crore)
 * and optional Bengali numerals.
 */
export function formatValue(
  value: number,
  useSouthAsian: boolean,
  useBengaliDigits: boolean,
  fractionDigits: number = 4
): string {
  if (value === 0) return useBengaliDigits ? '০' : '0';
  if (isNaN(value) || !isFinite(value)) return '';

  // Get a fixed precision string, then trim trailing decimals if they are zero
  let formatted = value.toFixed(fractionDigits);
  if (formatted.includes('.')) {
    // Remove trailing zeros
    formatted = formatted.replace(/0+$/, '').replace(/\.$/, '');
  }

  const parts = formatted.split('.');
  let integerStr = parts[0];
  const decimalStr = parts[1] ? '.' + parts[1] : '';

  // Check sign
  const isNegative = integerStr.startsWith('-');
  if (isNegative) {
    integerStr = integerStr.substring(1);
  }

  if (useSouthAsian) {
    // South Asian grouping: e.g. 12,34,567.89
    let lastThree = integerStr.slice(-3);
    const otherParts = integerStr.slice(0, -3);
    if (otherParts !== '') {
      const regex = /\B(?=(\d{2})+(?!\d))/g;
      const formattedOther = otherParts.replace(regex, ',');
      integerStr = formattedOther + ',' + lastThree;
    } else {
      integerStr = lastThree;
    }
  } else {
    // Standard international grouping: e.g. 1,234,567.89
    const regex = /\B(?=(\d{3})+(?!\d))/g;
    integerStr = integerStr.replace(regex, ',');
  }

  const sign = isNegative ? '-' : '';
  const result = sign + integerStr + decimalStr;

  return useBengaliDigits ? formatBengaliNumber(result) : result;
}

/**
 * Calculates and formats regional compound land formats (e.g. Bigha-Katha-Chotak, Kani-Gonda-Kora...)
 */
export interface CompoundPart {
  value: number;
  labelEn: string;
  labelBn: string;
}

export function getTraditionalBreakdown(
  sqft: number,
  regionId: string,
  useBengaliDigits: boolean,
  lang: Language
): string {
  if (sqft <= 0 || isNaN(sqft)) {
    return lang === 'en' ? '0 units' : '০ ইউনিট';
  }

  const parts: CompoundPart[] = [];

  switch (regionId) {
    case 'dhaka':
    case 'khulna_barishal':
    case 'rajshahi_rangpur':
    case 'west_bengal': {
      // 1 Bigha = 14,400 sqft, 1 Katha = 720 sqft, 1 Chotak = 45 sqft
      const bigha = Math.floor(sqft / 14400);
      const rem1 = sqft % 14400;
      const katha = Math.floor(rem1 / 720);
      const rem2 = rem1 % 720;
      const chotak = rem2 / 45;

      parts.push({ value: bigha, labelEn: 'bigha', labelBn: 'বিঘা' });
      parts.push({ value: katha, labelEn: 'katha', labelBn: 'কাঠা' });
      parts.push({ value: parseFloat(chotak.toFixed(2)), labelEn: 'chotak', labelBn: 'ছটাক' });
      break;
    }

    case 'chattogram': {
      // 1 Kani = 17,424 sqft, 1 Gonda = 871.2 sqft, 1 Kora = 217.8 sqft, 1 Kranti = 72.6 sqft, 1 Til = 3.63 sqft
      const kani = Math.floor(sqft / 17424);
      const rem1 = sqft % 17424;
      const gonda = Math.floor(rem1 / 871.2);
      const rem2 = rem1 % 871.2;
      const kora = Math.floor(rem2 / 217.8);
      const rem3 = rem2 % 217.8;
      const kranti = Math.floor(rem3 / 72.6);
      const rem4 = rem3 % 72.6;
      const til = rem4 / 3.63;

      parts.push({ value: kani, labelEn: 'kani', labelBn: 'কানি' });
      parts.push({ value: gonda, labelEn: 'gonda', labelBn: 'গন্ডা' });
      parts.push({ value: kora, labelEn: 'kora', labelBn: 'কড়া' });
      parts.push({ value: kranti, labelEn: 'kranti', labelBn: 'ক্রান্তি' });
      parts.push({ value: parseFloat(til.toFixed(2)), labelEn: 'til', labelBn: 'তিল' });
      break;
    }

    case 'sylhet': {
      // 1 Keyar = 13,068 sqft, 1 Poa = 3,267 sqft
      const keyar = Math.floor(sqft / 13068);
      const rem1 = sqft % 13068;
      const poa = rem1 / 3267;

      parts.push({ value: keyar, labelEn: 'keyar', labelBn: 'কেয়ার' });
      parts.push({ value: parseFloat(poa.toFixed(2)), labelEn: 'poa', labelBn: 'পোয়া' });
      break;
    }

    case 'assam': {
      // 1 Bigha = 14,400 sqft, 1 Katha = 2,880 sqft, 1 Lecha = 144 sqft
      const bigha = Math.floor(sqft / 14400);
      const rem1 = sqft % 14400;
      const katha = Math.floor(rem1 / 2880);
      const rem2 = rem1 % 2880;
      const lecha = rem2 / 144;

      parts.push({ value: bigha, labelEn: 'bigha', labelBn: 'বিঘা' });
      parts.push({ value: katha, labelEn: 'katha', labelBn: 'কাঠা' });
      parts.push({ value: parseFloat(lecha.toFixed(2)), labelEn: 'lecha', labelBn: 'লেচা' });
      break;
    }

    case 'up_bihar': {
      // 1 Bigha (Pucca) = 27,225 sqft, 1 Biswa = 1,361.25 sqft
      const bigha = Math.floor(sqft / 27225);
      const rem1 = sqft % 27225;
      const biswa = rem1 / 1361.25;

      parts.push({ value: bigha, labelEn: 'bigha', labelBn: 'বিঘা' });
      parts.push({ value: parseFloat(biswa.toFixed(2)), labelEn: 'biswa', labelBn: 'বিসোয়া' });
      break;
    }

    case 'punjab_sindh': {
      // 1 Kanal = 5,445 sqft, 1 Marla = 272.25 sqft
      const kanal = Math.floor(sqft / 5445);
      const rem1 = sqft % 5445;
      const marla = rem1 / 272.25;

      parts.push({ value: kanal, labelEn: 'kanal', labelBn: 'কানাল' });
      parts.push({ value: parseFloat(marla.toFixed(2)), labelEn: 'marla', labelBn: 'মারলা' });
      break;
    }

    default:
      return '';
  }

  // Filter out parts if they are 0 and we have non-zero elements, BUT keep at least the last part
  // Or simply show all parts to maintain standard compound reporting. Standard compound reporting is very helpful!
  return parts
    .map(p => {
      const valStr = formatValue(p.value, false, useBengaliDigits, 2);
      const label = lang === 'en' ? ` ${p.labelEn}` : ` ${p.labelBn}`;
      return `${valStr}${label}`;
    })
    .join(lang === 'en' ? ', ' : ', ');
}

/**
 * Checks if a string represents a mathematical expression (contains operators).
 */
export function isMathExpression(str: string): boolean {
  const clean = str.trim();
  if (/[+*\/()xX÷×]/.test(clean)) {
    return true;
  }
  // Check for minus/negative sign that is not at index 0
  const minusIndex = clean.indexOf('-');
  const bMinusIndex = clean.indexOf('−');
  if (minusIndex > 0 || bMinusIndex > 0) {
    return true;
  }
  return false;
}

/**
 * Evaluates a mathematical expression and returns the resulting number.
 * Returns null if the expression is invalid or incomplete.
 * Returns Infinity for division by zero.
 */
export function evaluateMathExpression(expr: string): number | null {
  // Strip all commas
  let clean = expr.replace(/,/g, '');
  // Convert Bengali digits to English
  clean = translateBengaliToEnglishDigits(clean);
  // Normalize characters
  clean = clean.replace(/−/g, '-');
  clean = clean.replace(/×/g, '*');
  clean = clean.replace(/x/g, '*');
  clean = clean.replace(/X/g, '*');
  clean = clean.replace(/÷/g, '/');
  
  // Tokenize
  const tokens: string[] = [];
  let i = 0;
  while (i < clean.length) {
    const char = clean[i];
    if (/\s/.test(char)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      let numStr = '';
      while (i < clean.length && /[0-9.]/.test(clean[i])) {
        numStr += clean[i];
        i++;
      }
      tokens.push(numStr);
      continue;
    }
    if (['+', '-', '*', '/', '(', ')'].includes(char)) {
      tokens.push(char);
      i++;
      continue;
    }
    // Invalid character
    return null;
  }

  // Recursive descent parser
  let tokenIndex = 0;
  function peek(): string | undefined {
    return tokens[tokenIndex];
  }
  function consume(expected?: string): string {
    const t = tokens[tokenIndex];
    if (expected !== undefined && t !== expected) {
      throw new Error(`Expected ${expected} but got ${t}`);
    }
    tokenIndex++;
    return t;
  }

  function parseExpression(): number {
    let result = parseTerm();
    while (true) {
      const p = peek();
      if (p === '+') {
        consume();
        result += parseTerm();
      } else if (p === '-') {
        consume();
        result -= parseTerm();
      } else {
        break;
      }
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (true) {
      const p = peek();
      if (p === '*') {
        consume();
        result *= parseFactor();
      } else if (p === '/') {
        consume();
        const divisor = parseFactor();
        if (divisor === 0) {
          throw new Error("div0");
        }
        result /= divisor;
      } else {
        break;
      }
    }
    return result;
  }

  function parseFactor(): number {
    const p = peek();
    if (p === undefined) {
      throw new Error("Unexpected end of input");
    }
    if (p === '-') {
      consume();
      return -parseFactor();
    }
    if (p === '+') {
      consume();
      return parseFactor();
    }
    if (p === '(') {
      consume();
      const val = parseExpression();
      consume(')');
      return val;
    }
    // Must be a number
    const num = parseFloat(p);
    if (isNaN(num)) {
      throw new Error("Not a number");
    }
    consume();
    return num;
  }

  try {
    if (tokens.length === 0) return null;
    const val = parseExpression();
    // Ensure all tokens consumed
    if (tokenIndex < tokens.length) {
      return null;
    }
    return val;
  } catch (err: any) {
    if (err && err.message === "div0") {
      return Infinity;
    }
    return null;
  }
}

/**
 * Sanitizes input values (useful for typing or pasting).
 * Strips currency symbols, spaces, unit words, keeping digits, commas, decimal points, and optionally operators.
 * Preserves a leading minus if allowNegative is true.
 */
export function sanitizeInputString(val: string, allowNegative: boolean, allowOperators: boolean = true): string {
  let result = '';
  
  // Skip leading whitespace and check for a leading minus
  let startIdx = 0;
  while (startIdx < val.length && /\s/.test(val[startIdx])) {
    startIdx++;
  }
  
  let isNegativePrefix = false;
  if (startIdx < val.length && (val[startIdx] === '-' || val[startIdx] === '−')) {
    if (allowNegative) {
      isNegativePrefix = true;
    }
    startIdx++; // Consume leading minus
  }
  
  for (let i = startIdx; i < val.length; i++) {
    const char = val[i];
    
    if (/[0-9০-৯]/.test(char)) {
      result += char;
    } else if (char === ',') {
      result += ',';
    } else if (char === '.') {
      result += '.';
    } else if (allowOperators && ['+', '*', '/', '(', ')', 'x', 'X', '×', '÷', '-', '−'].includes(char)) {
      if (char === '−') {
        result += '-';
      } else {
        result += char;
      }
    }
  }
  
  if (isNegativePrefix) {
    result = '-' + result;
  }
  
  return result;
}

/**
 * Parses a sanitized number input string.
 * Strips all commas, converts Bengali numerals, and checks for multiple decimal points or invalid formats.
 * Returns NaN if invalid.
 */
export function parseSanitizedNumber(str: string): number {
  if (!str) return NaN;
  
  // 1. Translate Bengali digits to English
  let clean = translateBengaliToEnglishDigits(str);
  
  // 2. Strip all commas
  clean = clean.replace(/,/g, '');
  
  clean = clean.trim();
  
  // 3. Check for multiple decimal points
  const dots = clean.split('.');
  if (dots.length > 2) {
    return NaN; // More than one decimal point
  }
  
  // 4. Validate that the string is a valid float
  // It can have an optional leading '-' or '+' followed by digits and optional single dot.
  // Regex: ^[+-]?(?:\d+(?:\.\d*)?|\.\d+)?$
  const floatRegex = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)?$/;
  if (!floatRegex.test(clean)) {
    return NaN;
  }
  
  const parsed = parseFloat(clean);
  return parsed;
}


