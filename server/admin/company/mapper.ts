import { CompanyRequest, CompanyEntity, CompanyIndex, CompanyListRequest } from "./types";

export function toCompanyEntity(
    input: CompanyRequest,
    existingCompanyEntity: CompanyEntity | undefined
): CompanyEntity {
    const now = new Date();
    return {
        id: input.id.trim(),
        name: input.name.trim(),
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
        geo: {
            lat: input.geo.lat,
            lng: input.geo.lng
        },
        created_at: existingCompanyEntity ? existingCompanyEntity.created_at : now,
        updated_at: now,
        active: input.active
    };
}

export function toCompanyRequest(
    input: CompanyEntity
): CompanyRequest {
    return {
        id: input.id,
        name: input.name,
        address: {
            street: input.address.street,
            number: input.address.number,
            complement: input.address.complement,
            district: input.address.district,
            city: input.address.city,
            state: input.address.state,
            state_full: input.address.state_full,
            postal_code: input.address.postal_code,
            country: input.address.country,
            country_code: input.address.country_code
        },
        geo: {
            lat: input.geo.lat,
            lng: input.geo.lng
        },
        active: input.active
    };
}

export function toCompanyListRequest(
    input: CompanyIndex
) : CompanyListRequest {
    return {
        id: input.id,
        name: input.name,
        active: input.active
    }
}