import { I18nValue } from "domain/language/types";

export interface ArticleRow {
    id: string;

    title_pt: string;
    title_en: string;
    title_es: string;

    slug_pt: string;
    slug_en: string;
    slug_es: string;

    heroImage: string;
    thumbnail: string;

    body_pt: string;
    body_en: string;
    body_es: string;

    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Article {
    id: string;
    title: I18nValue;
    slug: I18nValue;
    heroImage: string;
    thumbnail: string;
    body: I18nValue;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleListItem {
    id: string;
    title: string;
    slug: string;
    publicationDate: Date;
    active: boolean;
}