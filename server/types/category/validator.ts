import { CategoryRequest } from "./types";

export function validateCategory(
  category: CategoryRequest
): string[] {
  const errors: string[] = [];

  if (!category.id || category.id.trim().length < 3) 
    errors.push("O campo `id` deve ser um slug válido (mínimo 3 caracteres).");

  // name
  if (!category.name || category.name.trim().length < 2)
    errors.push("O campo `name` deve ser informado.");

  return errors;
}