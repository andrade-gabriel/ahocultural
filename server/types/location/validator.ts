import { LocationRequest } from "./types";

export function validateLocation(
  location: LocationRequest
): string[] {
  const errors: string[] = [];

  if (!location.id || location.id.trim().length < 3)
    errors.push("O campo `id` deve ser um slug válido (mínimo 3 caracteres).");

  // country
  if (!location.country || location.country.trim().length < 2)
    errors.push("O campo `country` deve ser informado.");

  // state
  if (!location.state || location.state.trim().length < 2)
    errors.push("O campo `state` deve ser informado.");

  // state
  if (!location.city || location.city.trim().length < 2)
    errors.push("O campo `city` deve ser informado.");

  // districts
  if (Object.keys(location.districtsAndSlugs).length > 0) {
    for (const [key, value] of Object.entries(location.districtsAndSlugs)) {
      if (!key || !value || value.trim().length < 2) {
        errors.push(`Campo inválido: \`${key}\` = \`${value}\``);
      }
    }
  }

  return errors;
}