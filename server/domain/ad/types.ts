import { I18nValue } from "domain/language/types";

export interface AdRow {
  id: number;
  ad_type_id: number;
  url: string;

  start_date: Date;
  end_date: Date;

  title_pt: string;
  title_en: string;
  title_es: string;

  thumbnail: string;
  pricing: number;

  active: number | boolean;

  // Campos opcionais via LEFT JOIN:
  category_id?: number | null;
  menu_type?: number | null;

  created_at: Date;
  updated_at: Date;
}

export enum AdType {
  Menu = 1,
  Category = 2,
}

export interface Ad {
  id: number;
  type: AdType;
  url: string;
  
  startDate: Date;
  endDate: Date;
  
  title: I18nValue;
  thumbnail: string;

  pricing: number;
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export interface AdCategory extends Ad {
  type: AdType.Category;
  categoryId: number;
}

export enum AdMenuType {
  Today = 1,        // Pra hoje
  ThisWeekend = 2,  // Este Fds
  ThisWeek = 3,     // Esta semana
  Featured = 4,     // Destaques
}

export interface AdMenu extends Ad {
  type: AdType.Menu;
  menuType: AdMenuType;
}

export interface AdListItem {
  id: number;

  title: string;
  type: number;
  startDate: Date;
  endDate: Date;

  active: boolean;
}

export type AnyAd = Ad | AdCategory | AdMenu;
