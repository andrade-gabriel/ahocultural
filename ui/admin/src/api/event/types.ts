import type { I18nValue } from "../i18n/types";

export type ListEventsParams = {
  skip?: number; // default 0
  take?: number; // default 10
  search?: string;
};

export interface Event {
  id: number;

  title: I18nValue;       // title_pt/en/es
  slug: I18nValue;        // slug_pt/en/es
  body: I18nValue;        // body_pt/en/es

  // FKs da tabela `event`
  categoryId: number;
  companyId: number;

  heroImage: string;
  thumbnail: string;

  startDate: Date;
  endDate: Date;
  pricing: number;
  externalTicketLink?: string | null;

  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  facilities?: EventFacility[];
  recurrence?: EventRecurrence;
  occurrences?: EventOccurrence[];
  isSponsored?: boolean;
}

// 1 = Acessibilidade, 2 = Estacionamento, 3 = Bicicletário...
export interface EventFacility {
  id: number;
  name: string;
}

export interface EventRecurrence {
  id: number;
  eventId: number;
  rrule: string;      // "FREQ=WEEKLY;BYDAY=WE"
  until: Date;
  exdates?: Date[];   // JSON no banco
  rdates?: Date[];    // JSON no banco
}

export interface EventOccurrence {
  id: number;
  eventId: number;
  occurrenceDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type HighlightItem = { id: string; weight?: number };
export type HighlightPayload = {
  version: number;
  updatedAt: string;     // ISO string
  items: HighlightItem[]; // máx. 16 itens (regra de negócio na UI)
  max?: number;           // opcional, ex.: 16
};