import { CategoryRequest } from "./types";

export function validateCategory(
  category: CategoryRequest
): string[] {
  const errors: string[] = [];

  for (const [lang, slug] of Object.entries(category.slug ?? {})) {
    if (!slug || slug.trim().length < 3) {
      errors.push(`O campo \`slug.${lang}\` deve ser um slug válido (mínimo 3 caracteres).`);
    }
  }

  // name
  for (const [lang, name] of Object.entries(category.name ?? {})) {
    if (!name || name.trim().length < 2) {
      errors.push(`O campo \`name.${lang}\` deve ser informado (mínimo 2 caracteres).`);
    }
  }

  return errors;
}