export interface LocationEntity {
    id: string; // slug de city
    country: string;
    state: string;
    city: string;
    districtsAndSlugs: Record<string, string>;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface LocationRequest {
    id: string; // slug de city
    country: string;
    state: string;
    city: string;
    districtsAndSlugs: Record<string, string>;
    active: boolean;
}

export interface LocationIndex {
    id: string; // slug de city
    country: string;
    state: string;
    city: string;
    districtsAndSlugs: Record<string, string>;
    active: boolean;
}

export interface LocationListRequest {
    id: string; // slug de city
    country: string;
    state: string;
    city: string;
    active: boolean;
}

export interface LocationToggleRequest {
    active: boolean; // slug de city
}

export interface LocationPayload {
    id: string; // slug de city
}