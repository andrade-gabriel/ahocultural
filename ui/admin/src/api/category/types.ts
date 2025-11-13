import type { I18nNullableValue, I18nValue } from "../i18n/types";

export type ListCategorysParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
  parent?: boolean;
};

export type Category = {
  id: string;
  name_pt: string;
  slug_pt: string;
  active: boolean;
};

export type CategoryDetail = {
  id: string;
  name: I18nValue;
  slug: I18nValue;
  description: I18nNullableValue;
  active: boolean;
};