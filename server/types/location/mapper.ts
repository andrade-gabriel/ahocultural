import { LocationRequest, LocationEntity, LocationIndex, LocationListRequest } from "./types";

export function toLocationEntity(
    input: LocationRequest,
    existingLocationEntity: LocationEntity | undefined
): LocationEntity {
    const now = new Date();
    return {
        id: input.id.toLowerCase().trim(),
        country: input.country,
        state: input.state,
        city: input.city,
        districtsAndSlugs: input.districtsAndSlugs,
        created_at: existingLocationEntity ? existingLocationEntity.created_at : now,
        updated_at: now,
        active: input?.active
    };
}

export function toLocationRequest(
    input: LocationEntity
): LocationRequest {
    return {
        id: input.id,
        country: input.country,
        state: input.state,
        city: input.city,
        districtsAndSlugs: input.districtsAndSlugs,
        active: input.active
    };
}

export function toLocationListRequest(
    input: LocationIndex
): LocationListRequest {
    return {
        id: input.id,
        country: input.country,
        state: input.state,
        city: input.city,
        active: input.active
    }
}

export function toLocationIndex(
    input: LocationEntity
): LocationIndex {
    return {
        id: input.id.trim(),
        country: input.country,
        state: input.state,
        city: input.city,
        districtsAndSlugs: input.districtsAndSlugs,
        active: input.active
    };
}
