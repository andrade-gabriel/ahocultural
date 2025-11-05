import { CompanyEntity } from "@company/types";
import { EventRequest, EventEntity, EventIndex, EventListRequest, EventPublicIndex } from "./types";
import { CategoryEntity, CategoryIndex } from "@category/types";
import { LocationEntity } from "@location/types";

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
        active: input?.active
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
        active: input.active
    };
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

export function toEventIndex(
    input: EventEntity,
    company: CompanyEntity,
    category: CategoryEntity
): EventIndex {
    return {
        id: input.id.trim(),
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
        categoryName: category.name.pt,
        categorySlug: category.slug.pt,
        company: input.company,
        location: company.location,
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
