export interface LocationEntity {
    id: string;
    country: string;
    countrySlug: string;
    state: string;
    stateSlug: string;
    city: string;
    citySlug: string;
    districtsAndSlugs: Record<string, string>;
    description: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface LocationRequest {
    id: string;
    country: string;
    countrySlug: string;
    state: string;
    stateSlug: string;
    city: string;
    citySlug: string;
    districtsAndSlugs: Record<string, string>;
    description: string;
    active: boolean;
}

export interface LocationIndex {
    id: string;
    country: string;
    countrySlug: string;
    state: string;
    stateSlug: string;
    city: string;
    citySlug: string;
    districtsAndSlugs: Record<string, string>;
    description: string;
    active: boolean;
}

export interface LocationListRequest {
    id: string;
    country: string;
    state: string;
    city: string;
    active: boolean;
}

export interface LocationToggleRequest {
    active: boolean;
}

export interface LocationPayload {
    id: string;
}