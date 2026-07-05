/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'bn';

export type RegionId =
  | 'dhaka'
  | 'chattogram'
  | 'sylhet'
  | 'khulna_barishal'
  | 'rajshahi_rangpur'
  | 'west_bengal'
  | 'assam'
  | 'up_bihar'
  | 'punjab_sindh';

export interface RegionInfo {
  id: RegionId;
  nameEn: string;
  nameBn: string;
  allowedUnits: string[];
}

export interface UnitDefinition {
  id: string;
  nameEn: string;
  nameBn: string;
  factor: number; // Factor to multiply to get base unit (or convert from base)
  symbolEn?: string;
  symbolBn?: string;
}

export type GeneralCategory =
  | 'length'
  | 'weight'
  | 'temp'
  | 'area'
  | 'volume'
  | 'speed'
  | 'time'
  | 'data';

export interface CurrencyInfo {
  code: string;
  nameEn: string;
  nameBn: string;
  flag: string;
  symbol: string;
}

export interface CurrencyData {
  base: string;
  date: string;
  rates: Record<string, number>;
}
