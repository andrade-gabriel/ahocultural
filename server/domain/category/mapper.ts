import { CategoryRequest, CategoryEntity, CategoryIndex, CategoryListRequest } from "./types";

export function toCategoryEntity(
    input: CategoryRequest,
    existingCategoryEntity: CategoryEntity | undefined
): CategoryEntity {
    const now = new Date();
    return {
        id: input?.id.trim(),
        name: {
            pt: input.name.pt.trim(),
            en: input.name.en.trim(),
            es: input.name.es.trim(),
        },
        slug: {
            pt: input.slug.pt.trim(),
            en: input.slug.en.trim(),
            es: input.slug.es.trim(),
        },
        description: {
            pt: input.description.pt?.trim(),
            en: input.description.en?.trim(),
            es: input.description.es?.trim(),
        },
        created_at: existingCategoryEntity ? existingCategoryEntity.created_at : now,
        updated_at: now,
        active: input?.active
    };
}

export function toCategoryRequest(
    input: CategoryEntity
): CategoryRequest {
    return {
        id: input.id,
        name: {
            pt: input.name.pt.trim(),
            en: input.name.en.trim(),
            es: input.name.es.trim(),
        },
        slug: {
            pt: input.slug.pt.trim(),
            en: input.slug.en.trim(),
            es: input.slug.es.trim(),
        },
        description: {
            pt: input.description.pt?.trim(),
            en: input.description.en?.trim(),
            es: input.description.es?.trim(),
        },
        active: input.active
    };
}

export function toCategoryListRequest(
    input: CategoryIndex
): CategoryListRequest {
    return {
        id: input.id,
        name: {
            pt: input.name.pt.trim(),
            en: input.name.en.trim(),
            es: input.name.es.trim(),
        },
        slug: {
            pt: input.slug.pt.trim(),
            en: input.slug.en.trim(),
            es: input.slug.es.trim(),
        },
        active: input.active
    }
}

export function toCategoryIndex(input: CategoryEntity): CategoryIndex {
    return {
        id: input.id.trim(),
        name: {
            pt: input.name.pt.trim(),
            en: input.name.en.trim(),
            es: input.name.es.trim(),
        },
        slug: {
            pt: input.slug.pt.trim(),
            en: input.slug.en.trim(),
            es: input.slug.es.trim(),
        },
        description: {
            pt: input.description.pt?.trim(),
            en: input.description.en?.trim(),
            es: input.description.es?.trim(),
        },
        active: input.active
    };
}
