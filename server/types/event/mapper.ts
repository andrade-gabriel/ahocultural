import { EventRequest, EventEntity, EventIndex, EventListRequest } from "./types";

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
        imageUrl: input.imageUrl,
        body: input.body,
        startDate: input.startDate,
        endDate: input.endDate,
        facilities: input.facilities,
        pricing: input.pricing,
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
        imageUrl: input.imageUrl,
        body: input.body,
        startDate: input.startDate,
        endDate: input.endDate,
        facilities: input.facilities,
        pricing: input.pricing,
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
    input: EventEntity
): EventIndex {
    return {
        id: input.id.trim(),
        title: input.title,
        slug: input.slug,
        category: input.category,
        company: input.company,
        imageUrl: input.imageUrl,
        startDate: input.startDate,
        endDate: input.endDate,
        facilities: input.facilities,
        pricing: input.pricing,
        sponsored: input.sponsored,
        created_at: input.created_at,
        updated_at: input.updated_at,
        active: input.active
    };
}
