import { I18nValue } from "domain/language/types";

export interface ArticleEntity {
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

export interface ArticleRequest {
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

export interface ArticleIndex {
    id: string;
    title: I18nValue;
    slug: I18nValue;
    heroImage: string;
    thumbnail: string;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleListRequest {
    id: string;
    title: I18nValue;
    slug: I18nValue;
    publicationDate: Date;
    active: boolean;
}

export interface ArticleToggleRequest {
    active: boolean;
}

export interface ArticlePayload {
    id: string;
}