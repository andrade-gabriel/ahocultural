import type { I18nValue } from "../i18n/types";

export interface Studio {
  body: I18nValue;
  categories: StudioCategory[];
}

export interface StudioCategory {
  name: I18nValue,
  medias: string[]
}