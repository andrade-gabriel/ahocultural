import { I18nValue } from "domain/language/types";

export interface AdvertisementRow {
  id: number;
  body_pt: string;
  body_en: string;
  body_es: string;
  created_at: Date;
  updated_at: Date;
}

export interface Advertisement {
    body: I18nValue;
}