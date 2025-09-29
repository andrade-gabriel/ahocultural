import { CompanyRequest } from "./types";

export function validateCompany(
  company: CompanyRequest
): string[] {
  const errors: string[] = [];

  if (!company.id || company.id.trim().length < 3) 
    errors.push("O campo `id` deve ser um slug válido (mínimo 3 caracteres).");

  // name
  if (!company.name || company.name.trim().length < 2)
    errors.push("O campo `name` deve ser informado.");

  // address
  const { address } = company;
  if (!address.street || address.street.trim().length < 2)
    errors.push("O campo `address.street` deve ser informado.");
  if (!address.city || address.city.trim().length < 2)
    errors.push("O campo `address.city` deve ser informado.");
  if (!address.state || address.state.trim().length < 2)
    errors.push("O campo `address.state` deve ser informado.");
  if (!address.country || address.country.trim().length < 2)
    errors.push("O campo `address.country` deve ser informado.");
  if (!address.country_code || !/^[A-Z]{2}$/.test(address.country_code))
    errors.push("O campo `address.country_code` deve ser um código ISO-3166-1 alpha-2 válido (ex: BR).");
  if (address.postal_code && !/^\d{5}-?\d{3}$/.test(address.postal_code))
    errors.push("O campo `address.postal_code` deve ser um CEP válido (ex: 01310-200).");

  // geo
  const { geo } = company;
  if (geo.lat !== null && (geo.lat < -90 || geo.lat > 90))
    errors.push("O campo `geo.lat` deve estar entre -90 e 90.");
  if (geo.lng !== null && (geo.lng < -180 || geo.lng > 180))
    errors.push("O campo `geo.lng` deve estar entre -180 e 180.");

  return errors;
}