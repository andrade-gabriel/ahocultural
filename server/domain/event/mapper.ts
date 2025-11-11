import { Company } from "@company/types";
import {
  EventRequest,
  EventEntity,
  EventIndex,
  EventListRequest,
  EventPublicIndex,
  generateEventIndexId,
} from "./types";
import { CategoryIndex } from "@category/types";
import { LocationEntity } from "@location/types";
import { rrulestr, RRuleSet, RRule } from "rrule";

/* ========= Mapeamentos básicos ========= */

export function toEventEntity(
  input: EventRequest,
  existingEventEntity: EventEntity | undefined
): EventEntity {
  const now = new Date();
  return {
    id: input.id.toLowerCase().trim(),
    title: {
      pt: input.title.pt.trim(),
      en: input.title.en.trim(),
      es: input.title.es.trim(),
    },
    slug: {
      pt: input.slug.pt.trim(),
      en: input.slug.en.trim(),
      es: input.slug.es.trim(),
    },
    category: input.category,
    company: input.company,
    heroImage: input.heroImage,
    thumbnail: input.thumbnail,
    body: {
      pt: input.body.pt.trim(),
      en: input.body.en.trim(),
      es: input.body.es.trim(),
    },
    startDate: input.startDate,
    endDate: input.endDate,
    facilities: input.facilities,
    pricing: input.pricing,
    externalTicketLink: input.externalTicketLink,
    sponsored: input.sponsored,
    created_at: existingEventEntity ? existingEventEntity.created_at : now,
    updated_at: now,
    active: input?.active,
    recurrence: input.recurrence
      ? {
          rrule: input.recurrence.rrule,
          until: input.recurrence.until,
          exdates: input.recurrence.exdates,
          rdates: input.recurrence.rdates,
        }
      : undefined,
  };
}

export function toEventRequest(input: EventEntity): EventRequest {
  return {
    id: input.id,
    title: {
      pt: input.title.pt.trim(),
      en: input.title.en.trim(),
      es: input.title.es.trim(),
    },
    slug: {
      pt: input.slug.pt.trim(),
      en: input.slug.en.trim(),
      es: input.slug.es.trim(),
    },
    category: input.category,
    company: input.company,
    heroImage: input.heroImage,
    thumbnail: input.thumbnail,
    body: {
      pt: input.body.pt.trim(),
      en: input.body.en.trim(),
      es: input.body.es.trim(),
    },
    startDate: input.startDate,
    endDate: input.endDate,
    facilities: input.facilities,
    pricing: input.pricing,
    externalTicketLink: input.externalTicketLink,
    sponsored: input.sponsored,
    created_at: input.created_at,
    updated_at: input.updated_at,
    active: input.active,
    recurrence: input.recurrence
      ? {
          rrule: input.recurrence.rrule,
          until: input.recurrence.until,
          exdates: input.recurrence.exdates,
          rdates: input.recurrence.rdates,
        }
      : undefined,
  };
}

export function toEventIndex(input: EventEntity, company: Company): EventIndex {
  return {
    id: input.id.trim(),
    esId: generateEventIndexId(input.id.trim(), input.startDate),
    title: {
      pt: input.title.pt.trim(),
      en: input.title.en.trim(),
      es: input.title.es.trim(),
    },
    slug: {
      pt: input.slug.pt.trim(),
      en: input.slug.en.trim(),
      es: input.slug.es.trim(),
    },
    category: input.category,
    company: input.company,
    location: company.locationId.toString(),
    geoLocation: { lat: company.geo.lat, lon: company.geo.lng },
    heroImage: input.heroImage,
    thumbnail: input.thumbnail,
    startDate: input.startDate,
    endDate: input.endDate,
    facilities: input.facilities,
    pricing: input.pricing,
    externalTicketLink: input.externalTicketLink,
    sponsored: input.sponsored,
    created_at: input.created_at,
    updated_at: input.updated_at,
    active: input.active,
  };
}

/* ========= Utilidades de data/RRULE ========= */

function toDateSafe(d: unknown): Date | null {
  const dt = d instanceof Date ? d : new Date(d as any);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toIcsUtc(dt: Date): string {
  // ISO:  2025-12-30T21:00:00.000Z → ICS: 20251230T210000Z
  const iso = dt.toISOString().replace(/\.\d{3}Z$/, "Z"); // remove ms
  return iso.replace(/[-:]/g, ""); // tira '-' e ':'
}

/** Remove DTSTART e extrai apenas a parte da RRULE (se vier com 'RRULE:') */
function extractPureRRule(raw: string): string {
  if (!raw) return "";
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^DTSTART\b/i.test(l));

  const joined = lines.join("\n");
  const m = joined.match(/RRULE\s*:\s*(.*)$/i);
  if (m) return m[1].trim();
  return joined.replace(/\s*\n\s*/g, "").trim();
}

/** Normaliza RRULE: uppercase nas chaves e converte qualquer UNTIL ISO → ICS */
function normalizeRRule(raw: string): string {
  const pure = extractPureRRule(raw);
  if (!pure) return pure;

  const parts = pure
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const normalized = parts.map((part) => {
    const i = part.indexOf("=");
    if (i <= 0) return part;
    const key = part.slice(0, i).trim().toUpperCase();
    let val = part.slice(i + 1).trim();

    if (key === "UNTIL") {
      if (/^\d{8}T\d{6}Z$/.test(val)) return `UNTIL=${val}`; // já ICS
      const d = toDateSafe(val);
      if (!d) throw new Error(`Invalid UNTIL value in RRULE: ${val}`);
      return `UNTIL=${toIcsUtc(d)}`;
    }
    return `${key}=${val}`;
  });

  // Rede de segurança: se escapar algum UNTIL=YYYY-MM-DDTHH:MM:SSZ, converte
  let joined = normalized.join(";");
  joined = joined.replace(
    /UNTIL=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)/g,
    (_m, iso) => `UNTIL=${toIcsUtc(new Date(iso))}`
  );

  return joined;
}

/* ========= Expansão para índices ========= */

export function toEventIndexes(
  event: EventEntity,
  company: Company
): EventIndex[] {
  if (!event.recurrence) return [toEventIndex(event, company)];

  const now = new Date();
  const defaultEnd = new Date();
  defaultEnd.setMonth(defaultEnd.getMonth() + 12); // guarda de segurança (12 meses)

  const startBase = toDateSafe(event.startDate) ?? now;
  const endBase = toDateSafe(event.endDate) ?? startBase;
  const baseDuration = Math.max(0, endBase.getTime() - startBase.getTime());

  // Limite de janela: menor entre recurrence.until (se válido) e +12 meses
  const untilCandidate = toDateSafe(event.recurrence.until);
  const windowEnd = new Date(
    Math.min((untilCandidate ?? defaultEnd).getTime(), defaultEnd.getTime())
  );
  if (windowEnd < now) return [];

  // RRULE limpa (sem DTSTART e com UNTIL normalizado)
  const rruleFixed = normalizeRRule(event.recurrence.rrule);

  // Sempre forneça DTSTART no texto em formato ICS
  const dtstartIcs = toIcsUtc(startBase); // <<<<<<<<<< IMPORTANTE
  const ruleText = `DTSTART:${dtstartIcs}\nRRULE:${rruleFixed}`;

  const ruleSet = new RRuleSet();
  const rule = rrulestr(ruleText) as RRule;
  ruleSet.rrule(rule);

  // RDATE / EXDATE
  for (const r of event.recurrence.rdates ?? []) {
    const d = toDateSafe(r);
    if (d) ruleSet.rdate(d);
  }
  for (const x of event.recurrence.exdates ?? []) {
    const d = toDateSafe(x);
    if (d) ruleSet.exdate(d);
  }

  // Expande ocorrências (inclusive limites)
  const occurrences = ruleSet.between(now, windowEnd, true) as Date[];

  const docs: EventIndex[] = occurrences.map((occ) => {
    const start = occ instanceof Date ? occ : new Date(occ);
    const end = new Date(start.getTime() + baseDuration);

    return {
      id: event.id.trim(),
      esId: generateEventIndexId(event.id.trim(), start),
      title: {
        pt: event.title.pt.trim(),
        en: event.title.en.trim(),
        es: event.title.es.trim(),
      },
      slug: {
        pt: event.slug.pt.trim(),
        en: event.slug.en.trim(),
        es: event.slug.es.trim(),
      },
      category: event.category,
      company: event.company,
      location: company.locationId.toString(),
      geoLocation: { lat: company.geo.lat, lon: company.geo.lng },
      heroImage: event.heroImage,
      thumbnail: event.thumbnail,
      startDate: start,
      endDate: end,
      facilities: event.facilities,
      pricing: event.pricing,
      externalTicketLink: event.externalTicketLink,
      sponsored: event.sponsored,
      created_at: event.created_at,
      updated_at: new Date(),
      active: event.active,
    };
  });

  docs.sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  return docs;
}

/* ========= List/Public ========= */

export function toEventListRequest(input: EventIndex): EventListRequest {
  return {
    id: input.id,
    title: {
      pt: input.title.pt.trim(),
      en: input.title.en.trim(),
      es: input.title.es.trim(),
    },
    slug: {
      pt: input.slug.pt.trim(),
      en: input.slug.en.trim(),
      es: input.slug.es.trim(),
    },
    active: input.active,
  };
}

export function toEventPublicIndex(
  event: EventEntity,
  category: CategoryIndex,
  company: Company,
  location: LocationEntity
): EventPublicIndex {
  const eventPublicIndex: EventPublicIndex = {
    id: event.id.trim(),
    title: {
      pt: event.title.pt.trim(),
      en: event.title.en.trim(),
      es: event.title.es.trim(),
    },
    slug: {
      pt: event.slug.pt.trim(),
      en: event.slug.en.trim(),
      es: event.slug.es.trim(),
    },
    categories: [
      {
        id: category.id,
        name: { pt: category.name.pt, es: category.name.es, en: category.name.en },
        slug: { pt: category.slug.pt, es: category.slug.es, en: category.slug.en },
      },
    ],
    company: {
      id: company.id.toString(),
      name: company.name,
      slug: company.slug,
      address: company.address,
    },
    location: {
      id: location.id,
      name: location.city,
      slug: location.citySlug,
      district: "Vila Madalena",
      districtSlug: "vila-madalena",
    },
    heroImage: event.heroImage,
    thumbnail: event.thumbnail,
    body: {
      pt: event.body.pt.trim(),
      en: event.body.en.trim(),
      es: event.body.es.trim(),
    },
    startDate: event.startDate,
    endDate: event.endDate,
    facilities: event.facilities,
    pricing: event.pricing,
    externalTicketLink: event.externalTicketLink,
    sponsored: event.sponsored,
    created_at: event.created_at,
    updated_at: event.updated_at,
    active: event.active,
  };
  return eventPublicIndex;
}
