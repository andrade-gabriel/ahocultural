import { I18nValue } from "domain/language/types";

export interface Event {
    id: number;
    title: I18nValue;
    slug: I18nValue;
    body: I18nValue;
    
    category: string;
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
    
    // Recurring
    recurrence?: {
        rrule: string;                                      // ex.: "FREQ=WEEKLY;BYDAY=WE"
        until: Date;                                        // Event will exists until...
        exdates?: Date[];                                   // Exception Dates
        rdates?: Date[];                                    // Extra Dates
        // overrides?: Record<string, Partial<EventEntity>>;   // Specific replacements
    };
}

export interface EventListRequest {
    id: string;
    title: I18nValue;
    slug: I18nValue;
    active: boolean;
}