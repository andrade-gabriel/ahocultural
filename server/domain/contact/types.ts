import { I18nValue } from "domain/language/types";

export interface ContactRow {
  id: number;
  body_pt: string;
  body_en: string;
  body_es: string;
  created_at: Date;
  updated_at: Date;
}

export interface Contact {
    body: I18nValue;
}