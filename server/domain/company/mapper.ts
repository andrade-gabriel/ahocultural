import { Company, CompanyRow } from "./types";

export const mapRowToCompany = (row: CompanyRow): Company => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: {
        street: row.street,
        number: row.number ?? undefined,
        complement: row.complement ?? undefined,
        district: row.district ?? undefined,
        city: row.city,
        state: row.state,
        state_full: undefined,
        postal_code: row.postal_code ?? undefined,
        country: row.country,
        country_code: row.country_code,
    },
    locationId: row.location_id,
    locationDistrictId: row.location_district_id,
    geo: {
        lat: row.latitude,
        lng: row.longitude,
    },
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
    active: !!row.active,
});

export function toCompanyEntity(
    input: Company,
    existingCompanyEntity: Company | undefined
): Company {
    const now = new Date();
    return {
        id: input.id ?? 0,
        name: input.name.trim(),
        slug: input.slug.trim(),
        address: {
            street: input.address.street.trim(),
            number: input.address.number?.trim(),
            complement: input.address.complement?.trim(),
            district: input.address.district?.trim(),
            city: input.address.city.trim(),
            state: input.address.state.trim(),
            state_full: input.address.state_full?.trim(),
            postal_code: input.address.postal_code?.trim(),
            country: input.address.country.trim(),
            country_code: input.address.country_code.trim().toUpperCase()
        },
        locationId: input.locationId ?? 0,
        locationDistrictId: input.locationDistrictId ?? 0,
        geo: {
            lat: input.geo.lat,
            lng: input.geo.lng
        },
        created_at: existingCompanyEntity ? existingCompanyEntity.created_at : now,
        updated_at: now,
        active: input.active
    };
}