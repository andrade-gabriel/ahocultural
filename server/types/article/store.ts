import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { ArticleEntity } from "./types";

/** Constant Properties */
const DEFAULT_PREFIX = "articles";
const amazons3Client = new S3Client({
    region: 'us-east-1'
});

export function buildKey(
    slug: string
): string {
    const key = `${DEFAULT_PREFIX}/${encodeURIComponent(slug.toLowerCase().trim())}.json`;
    return key;
}

export async function getArticleAsync(
    id: string,
    s3Bucket: string
): Promise<ArticleEntity | undefined> {
    const Key = buildKey(id);
    // TODO: futuro buscar no cloudfront
    try {
        const res = await amazons3Client.send(
            new GetObjectCommand({
                Bucket: s3Bucket
                , Key
            })
        );
        const text = await (res.Body as any)?.transformToString?.();
        if (text) {
            const raw = JSON.parse(text) as {
                id: string;
                title: {
                    pt: string;
                    en: string;
                    es: string;
                };
                slug: {
                    pt: string;
                    en: string;
                    es: string;
                };
                heroImage: string;
                thumbnail: string;
                body: {
                    pt: string;
                    en: string;
                    es: string;
                };
                publicationDate: Date;
                created_at: Date;
                updated_at: Date;
                active: boolean;
            };

            const article: ArticleEntity = {
                id: raw.id,
                title: {
                    pt: raw.title.pt,
                    en: raw.title.en,
                    es: raw.title.es
                },
                slug: {
                    pt: raw.slug.pt,
                    en: raw.slug.en,
                    es: raw.slug.es
                },
                heroImage: raw.heroImage,
                thumbnail: raw.thumbnail,
                body: {
                    pt: raw.body.pt,
                    en: raw.body.en,
                    es: raw.body.es
                },
                publicationDate: raw.publicationDate,
                created_at: raw.created_at,
                updated_at: raw.updated_at,
                active: raw.active
            };
            return article;
        }
    }
    catch (e) {
        console.log(`Error getting article: ${e}`);
    }
    return undefined;
}

export async function upsertArticleAsync(
    article: ArticleEntity,
    s3Bucket: string
): Promise<Boolean> {
    let successfullyCreated: Boolean;
    try {
        const key = buildKey(article.id);
        await amazons3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: JSON.stringify(article),
                ContentType: "application/json",
            })
        );
        successfullyCreated = true;
    }
    catch (e) {
        console.log(`Error creating article: ${e}`);
        successfullyCreated = false;
    }
    return successfullyCreated;
}