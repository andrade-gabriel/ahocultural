import { LocationRequest } from "./types";

export function validateLocation(
  location: LocationRequest
): string[] {
  const errors: string[] = [];
  // country
  if (!location.country || location.country.trim().length < 2)
    errors.push("O campo `country` deve ser informado.");

  // countrySlug
  if (!location.countrySlug || location.countrySlug.trim().length < 2)
    errors.push("O campo `countrySlug` deve ser informado.");

  // state
  if (!location.state || location.state.trim().length < 2)
    errors.push("O campo `state` deve ser informado.");

  // stateSlug
  if (!location.stateSlug || location.stateSlug.trim().length < 2)
    errors.push("O campo `stateSlug` deve ser informado.");

  // citySlug
  if (!location.citySlug || location.citySlug.trim().length < 2)
    errors.push("O campo `citySlug` deve ser informado.");

  // city
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