import { Category } from "./types";

export function validateCategory(category: Category): string[] {
  const errors: string[] = [];

  // Names
  if (!category.name.pt || category.name.pt.trim().length < 2)
    errors.push("O campo `name.pt` deve ser informado.");
  if (!category.name.en || category.name.en.trim().length < 2)
    errors.push("O campo `name.en` deve ser informado.");
  if (!category.name.es || category.name.es.trim().length < 2)
    errors.push("O campo `name.es` deve ser informado.");

  // Slugs
  if (!category.slug.pt || category.slug.pt.trim().length < 3)
    errors.push("O campo `slug.pt` deve ter ao menos 3 caracteres.");
  if (!category.slug.en || category.slug.en.trim().length < 3)
    errors.push("O campo `slug.en` deve ter ao menos 3 caracteres.");
  if (!category.slug.es || category.slug.es.trim().length < 3)
    errors.push("O campo `slug.es` deve ter ao menos 3 caracteres.");

  return errors;
}
