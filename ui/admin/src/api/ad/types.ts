// packages/app/src/api/ad/types.ts
import type { I18nValue } from "../i18n/types";

export type ListAdsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type AdType = 1 | 2;
export type AdMenuType = 1 | 2 | 3 | 4;

export type Ad = {
  id: number;
  type: AdType;
  url: string;
  
  startDate: Date;
  endDate: Date;

  title: I18nValue;
  thumbnail: string;

  pricing: number;
  active: boolean;
};

export type AdCategory = Ad & {
  type: 1;
  categoryId: number;
};

export type AdMenu = Ad & {
  type: 2;
  menuType: AdMenuType | undefined;
};

export type AnyAd = Ad | AdCategory | AdMenu;

export type AdListItem = {
  id: number;
  title: string;
  type: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
};