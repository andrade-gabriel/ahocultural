export interface EventEntity {
    id: string;
    title: string;
    slug: string;
    category: string;
    imageUrl: string;
    body: string;
    startDate: Date;
    endDate: Date;
    location: string;
    pricing: number;
    facilities: string[];
    sponsored: boolean;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface EventRequest {
    id: string;
    title: string;
    slug: string;
    category: string;
    imageUrl: string;
    body: string;
    startDate: Date;
    endDate: Date;
    location: string;
    pricing: number;
    facilities: string[];
    sponsored: boolean;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface EventIndex {
    id: string;
    title: string;
    slug: string;
    category: string;
    imageUrl: string;
    startDate: Date;
    endDate: Date;
    location: string;
    pricing: number;
    facilities: string[];
    sponsored: boolean;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface EventListRequest {
    id: string;
    title: string;
    slug: string,
    active: boolean;
}

export interface EventToggleRequest {
    active: boolean;
}

export interface EventPayload {
    id: string;
}