import { ArticleRequest, ArticleEntity, ArticleIndex, ArticleListRequest } from "./types";

export function toArticleEntity(
    input: ArticleRequest,
    existingArticleEntity: ArticleEntity | undefined
): ArticleEntity {
    const now = new Date();
    return {
        id: input.id.toLowerCase().trim(),
        title: input.title,
        imageUrl: input.imageUrl,
        body: input.body,
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
        title: input.title,
        imageUrl: input.imageUrl,
        body: input.body,
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
        title: input.title,
        publicationDate: input.publicationDate,
        active: input.active
    }
}

export function toArticleIndex(
    input: ArticleEntity
): ArticleIndex {
    return {
        id: input.id.trim(),
        title: input.title,
        imageUrl: input.imageUrl,
        publicationDate: input.publicationDate,
        created_at: input.created_at,
        updated_at: input.updated_at,
        active: input.active
    };
}
