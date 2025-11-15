import { I18nValue } from "domain/language/types";

export interface EventRow {
  id: number;

  category_id: number;
  company_id: number;

  title_pt: string;
  title_en: string;
  title_es: string;

  slug_pt: string;
  slug_en: string;
  slug_es: string;

  body_pt: string;
  body_en: string;
  body_es: string;

  hero_image: string;
  thumbnail: string;

  start_date: Date | string;
  end_date: Date | string;

  pricing: number;
  external_ticket_link: string | null;

  active: number | boolean; // MySQL pode devolver 0/1

  created_at: Date | string;
  updated_at: Date | string;
}

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

export interface EventSponsoredPeriod {
  id: number;
  eventId: number;
  startDate: Date;
  endDate: Date;
  active: boolean;
}

export interface EventListItem {
  id: number;
  title: string; // Usando title_pt como padrão para listagem

  startDate: Date;
  endDate: Date;

  active: boolean;
}
