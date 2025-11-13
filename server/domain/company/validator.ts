import { Company } from "./types";

export function validateCompany(
  company: Company
): string[] {
  const errors: string[] = [];

  if (!company.slug || company.slug.trim().length < 3) 
    errors.push("O campo `slug` deve ser um slug válido (mínimo 3 caracteres).");

  // name
  if (!company.name || company.name.trim().length < 2)
    errors.push("O campo `name` deve ser informado.");

  // address
  const { address } = company;
  if (!address.street || address.street.trim().length < 2)
    errors.push("O campo `address.street` deve ser informado.");
  if (!address.number || address.number.trim().length < 2)
    errors.push("O campo `address.number` deve ser informado.");
  if (!address.district || address.district.trim().length < 2)
    errors.push("O campo `address.district` deve ser informado.");
  if (!address.locationId || address.locationId == 0)
    errors.push("O campo `address.locationId` deve ser informado.");
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