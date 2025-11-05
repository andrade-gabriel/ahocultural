export interface FileProperty {
    name: string;
    url: string;
    size: number;
    contentType: string;
    etag: string | null;
    lastModified: string | null;
    cacheControl: string | null;
}

export enum SeoImageType {
    Hero,
    Thumbnail
}