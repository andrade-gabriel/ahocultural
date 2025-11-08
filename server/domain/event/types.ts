import { I18nValue } from "domain/language/types";
import { v5 as uuidv5 } from "uuid";

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
    
    // Recurring
    recurrence?: {
        rrule: string;                                      // ex.: "FREQ=WEEKLY;BYDAY=WE"
        until: Date;                                        // Event will exists until...
        exdates?: Date[];                                   // Exception Dates
        rdates?: Date[];                                    // Extra Dates
        // overrides?: Record<string, Partial<EventEntity>>;   // Specific replacements
    };
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
    // Recurring
    recurrence?: {
        rrule: string;                                      // ex.: "FREQ=WEEKLY;BYDAY=WE"
        until: Date;                                        // Event will exists until...
        exdates?: Date[];                                   // Exception Dates
        rdates?: Date[];                                    // Extra Dates
        // overrides?: Record<string, Partial<EventEntity>>;   // Specific replacements
    };
}

export interface EventIndex {
    id: string;
    esId: string;
    title: I18nValue;
    slug: I18nValue;
    category: string;
    // categoryName: string;
    // categorySlug: string;
    company: string;
    location: string; // sao-paulo
    geoLocation: {
        lat: number;
        lon: number;
    }
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

export const generateEventIndexId = (id: string, date: Date | string): string => {
  // TODO: config
  const NAMESPACE_EVENTS = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

  // Convert safely to Date if necessary
  const parsedDate = date instanceof Date ? date : new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date passed to generateEventIndexId");
  }

  const input = `${id}-${parsedDate.toISOString()}`;
  return uuidv5(input, NAMESPACE_EVENTS);
};

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
    slug: I18nValue;
    active: boolean;
}

export interface EventToggleRequest {
    active: boolean;
}

export interface EventPayload {
    id: string;
}