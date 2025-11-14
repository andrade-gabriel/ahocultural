import { I18nValue } from "domain/language/types";

export interface StudioRow {
  id: number;
  body_pt: string;
  body_en: string;
  body_es: string;
  created_at: Date;
  updated_at: Date;
}

export interface StudioCategoryMediaRow {
  id: number;
  name_pt: string;
  name_en: string;
  name_es: string;
  file_path: string;
  created_at: Date;
  updated_at: Date;
}

export interface Studio {
  body: I18nValue;
  categories: StudioCategory[];
}

export interface StudioCategory {
  name: I18nValue,
  medias: string[]
}