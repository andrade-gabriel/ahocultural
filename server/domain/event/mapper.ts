import { Event } from "./types";
import { EventRow, EventListItem } from "./types";

/**
 * Converte um EventRow completo em um Event de domínio.
 */
export function mapRowToEvent(row: EventRow): Event {
  return {
    id: row.id,

    title: {
      pt: row.title_pt ?? "",
      en: row.title_en ?? "",
      es: row.title_es ?? "",
    },

    slug: {
      pt: row.slug_pt ?? "",
      en: row.slug_en ?? "",
      es: row.slug_es ?? "",
    },

    body: {
      pt: row.body_pt ?? "",
      en: row.body_en ?? "",
      es: row.body_es ?? "",
    },

    categoryId: row.category_id,
    companyId: row.company_id,

    heroImage: row.hero_image,
    thumbnail: row.thumbnail,

    startDate: toDate(row.start_date),
    endDate: toDate(row.end_date),

    pricing: row.pricing,
    externalTicketLink: row.external_ticket_link ?? null,

    active: toBool(row.active),
    createdAt: toDate(row.created_at),
    updatedAt: toDate(row.updated_at),

    // Lazy-load / relations
    facilities: undefined,
    recurrence: undefined,
    occurrences: undefined
  };
}

/**
 * Converte um EventRow em um item leve para listagem.
 */
export function mapRowToEventListItem(row: EventRow): EventListItem {
  return {
    id: row.id,
    title: row.title_pt ?? "",
    startDate: toDate(row.start_date),
    endDate: toDate(row.end_date),
    active: toBool(row.active),
  };
}

/**
 * Helpers
 */
function toDate(d: any): Date {
  if (d instanceof Date) return d;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  return v === 1 || v === "1" || v === "true";
}
