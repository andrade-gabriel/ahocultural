export interface ArticleEntity {
    id: string; // slug
    title: string;
    imageUrl: string;
    body: string;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleRequest {
    id: string; // slug
    title: string;
    imageUrl: string;
    body: string;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleIndex {
    id: string; // slug
    title: string;
    imageUrl: string;
    publicationDate: Date;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface ArticleListRequest {
    id: string; // slug
    title: string;
    publicationDate: Date;
    active: boolean;
}

export interface ArticleToggleRequest {
    active: boolean;
}

export interface ArticlePayload {
    id: string;
}