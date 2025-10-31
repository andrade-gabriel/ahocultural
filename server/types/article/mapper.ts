import { ArticleRequest, ArticleEntity, ArticleIndex, ArticleListRequest } from "./types";

export function toArticleEntity(
    input: ArticleRequest,
    existingArticleEntity: ArticleEntity | undefined
): ArticleEntity {
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
        heroImage: input.heroImage,
        thumbnail: input.thumbnail,
        body: {
            pt: input.body.pt.trim(),
            en: input.body.en.trim(),
            es: input.body.es.trim(),
        },
        publicationDate: input.publicationDate,
        created_at: existingArticleEntity ? existingArticleEntity.created_at : now,
        updated_at: now,
        active: input?.active
    };
}

export function toArticleRequest(
    input: ArticleEntity
): ArticleRequest {
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
        heroImage: input.heroImage,
        thumbnail: input.thumbnail,
        body: {
            pt: input.body.pt.trim(),
            en: input.body.en.trim(),
            es: input.body.es.trim(),
        },
        publicationDate: input.publicationDate,
        created_at: input.created_at,
        updated_at: input.updated_at,
        active: input.active
    };
}

export function toArticleListRequest(
    input: ArticleIndex
): ArticleListRequest {
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
        publicationDate: input.publicationDate,
        active: input.active
    }
}

export function toArticleIndex(
    input: ArticleEntity
): ArticleIndex {
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
        heroImage: input.heroImage,
        thumbnail: input.thumbnail,
        publicationDate: input.publicationDate,
        created_at: input.created_at,
        updated_at: input.updated_at,
        active: input.active
    };
}
