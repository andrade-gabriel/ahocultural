// mapper.ts

import { Category, CategoryRow } from "./types";

export const mapRowToCategory = (row: CategoryRow): Category => ({
  id: row.id,

  name: {
    pt: row.name_pt,
    en: row.name_en,
    es: row.name_es,
  },

  slug: {
    pt: row.slug_pt,
    en: row.slug_en,
    es: row.slug_es,
  },

  description: {
    pt: row.description_pt ?? undefined,
    en: row.description_en ?? undefined,
    es: row.description_es ?? undefined,
  },

  active: !!row.active,
  created_at: new Date(row.created_at),
  updated_at: new Date(row.updated_at),
});

export function toCategory(
  input: Category,
  existing: Category | undefined
): Category {
  const now = new Date();

  return {
    id: input.id ?? 0,

    name: {
      pt: input.name.pt.trim(),
      en: input.name.en.trim(),
      es: input.name.es.trim(),
    },

    slug: {
      pt: input.slug.pt.trim(),
      en: input.slug.en.trim(),
      es: input.slug.es.trim(),
    },

    description: {
      pt: input.description?.pt?.trim(),
      en: input.description?.en?.trim(),
      es: input.description?.es?.trim(),
    },

    active: input.active,
    created_at: existing ? existing.created_at : now,
    updated_at: now,
  };
}
