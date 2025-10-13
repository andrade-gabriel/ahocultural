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
        title: input.title,
        slug: input.slug,
        category: input.category,
        company: input.company,
        heroImage: input.heroImage,
        thumbnail: input.thumbnail,
        body: input.body,
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
        title: input.title,
        slug: input.slug,
        category: input.category,
        company: input.company,
        heroImage: input.heroImage,
        thumbnail: input.thumbnail,
        body: input.body,
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
        title: input.title,
        slug: input.slug,
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
        title: input.title,
        slug: input.slug,
        category: input.category,
        categoryName: category.name,
        categorySlug: category.slug,
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
        title: event.title,
        slug: event.slug,
        categories: [
            {
                id: category.id,
                name: category.name,
                slug: category.slug
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
        body: event.body,
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
    if(category.parent_id && category.parent_name && category.parent_slug){
        eventPublicIndex.categories.push({
            id: category.parent_id,
            name: category.parent_name,
            slug: category.parent_slug
        })
    }
    return eventPublicIndex;
}
