import { Article, ArticleListItem, ArticleRow } from "./types";

export function mapRowToArticle(
    input: ArticleRow
): Article {
    return {
        id: input?.id,
        title: {
            pt: input?.title_pt.trim(),
            en: input?.title_en.trim(),
            es: input?.title_es.trim(),
        },
        slug: {
            pt: input?.slug_pt.trim(),
            en: input?.slug_en.trim(),
            es: input?.slug_es.trim(),
        },
        heroImage: input?.heroImage,
        thumbnail: input?.thumbnail,
        body: {
            pt: input?.body_pt.trim(),
            en: input?.body_en.trim(),
            es: input?.body_es.trim(),
        },
        publicationDate: input?.publicationDate,
        active: input?.active,
        created_at: input?.created_at,
        updated_at: input?.updated_at,
    };
}

export function mapRowToArticleListItem(
    input: ArticleRow
): ArticleListItem {
    return {
        id: input?.id,
        title: input?.title_pt.trim(),
        slug: input?.slug_pt.trim(),
        publicationDate: input?.publicationDate,
        active: input?.active
    };
}