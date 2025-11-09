import type { I18nValue } from "../i18n/types";

export type ListEventsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export type Event = {
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
};

export type EventDetail = {
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
  recurrence?: {
      rrule: string;                                      // ex.: "FREQ=WEEKLY;BYDAY=WE"
      until: Date;                                        // Event will exists until...
      exdates?: Date[];                                   // Exception Dates
      rdates?: Date[];                                    // Extra Dates
      // overrides?: Record<string, Partial<EventEntity>>;   // Specific replacements
  };
};

export type HighlightItem = { id: string; weight?: number };
export type HighlightPayload = {
  version: number;
  updatedAt: string;     // ISO string
  items: HighlightItem[]; // máx. 16 itens (regra de negócio na UI)
  max?: number;           // opcional, ex.: 16
};