export interface EventEntity {
    id: string;
    title: string;
    slug: string;
    category: string;
    location: string;
    company: string;
    heroImage: string;
    thumbnail: string;
    body: string;
    startDate: Date;
    endDate: Date;
    pricing: number;
    externalTicketLink: string;
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
    location: string;
    company: string;
    heroImage: string;
    thumbnail: string;
    body: string;
    startDate: Date;
    endDate: Date;
    pricing: number;
    externalTicketLink: string;
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
    location: string;
    company: string;
    heroImage: string;
    thumbnail: string;
    startDate: Date;
    endDate: Date;
    pricing: number;
    externalTicketLink: string;
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