export interface ArticleEntity {
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    body: string;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleRequest {
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    body: string;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleIndex {
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleListRequest {
    id: string;
    title: string;
    slug: string;
    publicationDate: Date;
    active: boolean;
}

export interface ArticleToggleRequest {
    active: boolean;
}

export interface ArticlePayload {
    id: string;
}