import { I18nValue } from "types/language/types";

export interface EventEntity {
    id: string;
    title: I18nValue;
    slug: I18nValue;
    category: string;
    company: string;
    heroImage: string;
    thumbnail: string;
    body: I18nValue;
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
    title: I18nValue;
    slug: I18nValue;
    category: string;
    company: string;
    heroImage: string;
    thumbnail: string;
    body: I18nValue;
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
    title: I18nValue;
    slug: I18nValue;
    category: string;
    categoryName: string;
    categorySlug: string;
    company: string;
    location: string;
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

export interface EventPublicIndex {
    id: string;
    title: I18nValue;
    slug: I18nValue;
    categories: EventCategoryIndex[]
    location: EventLocationIndex;
    company: EventCompanyIndex;
    heroImage: string;
    thumbnail: string;
    body: I18nValue;
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

export interface EventCategoryIndex {
    id: string;
    slug: I18nValue;
    name: I18nValue;
}

export interface EventCompanyIndex {
    id: string;
    slug: string;
    name: string;
    address: {
        street: string;         // "Av. Paulista"
        number?: string;        // "1578"
        complement?: string;    // "Conj. 1203"
        district?: string;      // "Bela Vista"
        city: string;           // "São Paulo"
        state: string;          // "SP"
        state_full?: string;    // "São Paulo"
        postal_code?: string;   // "01310-200"
        country: string;        // "Brasil"
        country_code: string;   // "BR"
    }
}

export interface EventLocationIndex {
    id: string;
    slug: string;
    name: string;
    district: string | null;
    districtSlug: string | null;
}

export interface EventListRequest {
    id: string;
    title: I18nValue;
    slug: I18nValue,
    active: boolean;
}

export interface EventToggleRequest {
    active: boolean;
}

export interface EventPayload {
    id: string;
}