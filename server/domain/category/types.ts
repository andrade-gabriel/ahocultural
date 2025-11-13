// types.ts

export type CategoryRow = {
  id: number;

  name_pt: string;
  name_en: string;
  name_es: string;

  slug_pt: string;
  slug_en: string;
  slug_es: string;

  description_pt: string | null;
  description_en: string | null;
  description_es: string | null;

  active: number | boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

export interface Category {
  id: number;

  name: {
    pt: string;
    en: string;
    es: string;
  };

  slug: {
    pt: string;
    en: string;
    es: string;
  };

  description: {
    pt?: string;
    en?: string;
    es?: string;
  };

  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryListItem {
  id: string;
  name_pt: string;
  slug_pt: string;
  active: boolean;
}
