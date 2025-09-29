import { CompanyEntity, CompanyIndex } from "./types";

export function toCompanyIndex(
  input: CompanyEntity
): CompanyIndex {
  return {
    id: input.id.trim(),
    name: input.name.trim(),
    street: input.address.street.trim(),
    number: input.address.number?.trim(),
    complement: input.address.complement?.trim(),
    district: input.address.district?.trim(),
    city: input.address.city.trim(),
    state: input.address.state.trim(),
    state_full: input.address.state_full?.trim(),
    postal_code: input.address.postal_code?.trim(),
    country: input.address.country.trim(),
    country_code: input.address.country_code.trim().toUpperCase(),
    geo: {
      lat: input.geo.lat ?? 0,
      lon: input.geo.lng ?? 0
    },
    active: input.active
  };
}
