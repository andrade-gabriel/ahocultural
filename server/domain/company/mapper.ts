import { Company, CompanyRow } from "./types";

export const mapRowToCompany = (row: CompanyRow): Company => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    address: {
        locationId: row.location_id,
        locationDistrictId: row.location_district_id,
        street: row.street,
        number: row.number ?? undefined,
        complement: row.complement ?? undefined,
        district: row.district ?? undefined,
        postal_code: row.postal_code ?? undefined,
    },
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
            locationId: input.address?.locationId ?? 0,
            locationDistrictId: input.address?.locationDistrictId ?? 0,
            street: input.address?.street.trim(),
            number: input.address?.number?.trim(),
            complement: input.address?.complement?.trim(),
            district: input.address?.district?.trim(),
            postal_code: input.address?.postal_code?.trim(),
        },
        geo: {
            lat: input.geo.lat,
            lng: input.geo.lng
        },
        created_at: existingCompanyEntity ? existingCompanyEntity.created_at : now,
        updated_at: now,
        active: input.active
    };
}