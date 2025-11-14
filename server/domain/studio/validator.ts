import { Studio } from "./types";

export function validateStudio(item: Studio): string[] {
  const errors: string[] = [];

  const isEmpty = (value?: string | null) =>
    !value || value.trim().length < 2;

  // body
  if (!item.body || isEmpty(item.body.pt) || isEmpty(item.body.en) || isEmpty(item.body.es))
    errors.push("O campo `body` deve ser informado em todos os idiomas (pt, en, es).");

  // body
  if (item.categories && Array.isArray(item.categories)) {
    for (const category of item.categories) {
      // name
      if (!category || isEmpty(category.name.pt.trim()) || isEmpty(category.name.en?.trim()) || isEmpty(category.name.es?.trim()))
        errors.push("O campo `category..name` deve ser informado em todos os idiomas (pt, en, es).");

      // medias
      if (!category.medias || !Array.isArray(category.medias))
        errors.push("O campo `categories..medias` deve ser informado em todos os idiomas (pt, en, es).");
    }
  }
  else
    errors.push("O campo `body` deve ser informado em todos os idiomas (pt, en, es).");

  return errors;
}