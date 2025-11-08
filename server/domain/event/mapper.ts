import { CompanyEntity } from "@company/types";
import { EventRequest, EventEntity, EventIndex, EventListRequest, EventPublicIndex, generateEventIndexId } from "./types";
import { CategoryIndex } from "@category/types";
import { LocationEntity } from "@location/types";
import { rrulestr, RRuleSet, RRule } from "rrule";

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
        recurrence: input.recurrence ? {
            rrule: input.recurrence.rrule,
            until: input.recurrence.until,
            exdates: input.recurrence.exdates,
            rdates: input.recurrence.rdates
        } : undefined
    };
}

export function toEventRequest(
    input: EventEntity
): EventRequest {
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
        recurrence: input.recurrence ? {
            rrule: input.recurrence?.rrule,
            until: input.recurrence?.until,
            exdates: input.recurrence?.exdates,
            rdates: input.recurrence?.rdates
        } : undefined
    };
}

export function toEventIndex(
    input: EventEntity,
    company: CompanyEntity,
): EventIndex {
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
        location: company.location,
        geoLocation: {
            lat: company.geo.lat,
            lon: company.geo.lng,
        },
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
        active: input.active
    };
}

export function toEventIndexes(
  event: EventEntity,
  company: CompanyEntity
): EventIndex[] {
  if (!event.recurrence) {
    return [toEventIndex(event, company)];
  }

  const now = new Date();
  const defaultEnd = new Date();
  defaultEnd.setMonth(defaultEnd.getMonth() + 12);

  const recurrenceUntil = event.recurrence.until ?? defaultEnd;
  const windowEnd = new Date(Math.min(recurrenceUntil.getTime(), defaultEnd.getTime()));

  const baseDuration =
    new Date(event.endDate).getTime() - new Date(event.startDate).getTime();

  const ruleSet = new RRuleSet();

  const dtstartIso = new Date(event.startDate)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");
  const rrule = rrulestr(`DTSTART:${dtstartIso}\nRRULE:${event.recurrence.rrule}`) as RRule;
  ruleSet.rrule(rrule);

  for (const r of event.recurrence.rdates ?? []) ruleSet.rdate(new Date(r));
  for (const x of event.recurrence.exdates ?? []) ruleSet.exdate(new Date(x));

  const occurrences: Date[] = ruleSet.between(now, windowEnd, true) as Date[];

  const docs: EventIndex[] = occurrences.map((occDate: Date) => {
    const start = new Date(occDate);
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
      location: company.location,
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

export function toEventListRequest(
    input: EventIndex
): EventListRequest {
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
        active: input.active
    }
}

export function toEventPublicIndex(
    event: EventEntity,
    category: CategoryIndex,
    company: CompanyEntity,
    location: LocationEntity

): EventPublicIndex {
    let eventPublicIndex : EventPublicIndex = {
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
                name: {
                    pt: category.name.pt,
                    es: category.name.es,
                    en: category.name.en
                },
                slug: {
                    pt: category.slug.pt,
                    es: category.slug.es,
                    en: category.slug.en
                }
            }
        ],
        company: {
            id: company.id,
            name: company.name,
            slug: company.slug,
            address: company.address
        },
        location: {
            id: location.id,
            name: location.city,
            slug: location.citySlug,
            district: 'Vila Madalena',
            districtSlug: 'vila-madalena'
        },
        heroImage: event.heroImage,
        thumbnail: event.thumbnail,
        body: {
            pt: event.body.pt.trim(),
            en: event.body.en.trim(),
            es: event.body.es.trim()
        },
        startDate: event.startDate,
        endDate: event.endDate,
        facilities: event.facilities,
        pricing: event.pricing,
        externalTicketLink: event.externalTicketLink,
        sponsored: event.sponsored,
        created_at: event.created_at,
        updated_at: event.updated_at,
        active: event.active
    };
    return eventPublicIndex;
}
