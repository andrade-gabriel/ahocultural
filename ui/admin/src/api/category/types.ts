export type ListCategorysParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
  parent?: boolean;
};

export type Category = {
  id: string;
  // parent_id: string | null;
  // parent_name: string | null;
  // parent_slug: string | null;
  name: LanguageValue;
  slug: LanguageValue;
  description: LanguageValue | null;
  active: boolean;
};

export type LanguageValue = {
  pt: string;
  en: string;
  es: string;
}

export type CategoryDetail = {
  id: string;
  name: LanguageValue;
  slug: LanguageValue;
  description: LanguageValue;
  active: boolean;
};