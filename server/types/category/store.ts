import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { CategoryEntity } from "./types";

/** Constant Properties */
const DEFAULT_PREFIX = "categories";
const amazons3Client = new S3Client({
    region: 'us-east-1'
});

export function buildKey(
    slug: string
): string {
    const key = `${DEFAULT_PREFIX}/${encodeURIComponent(slug.toLowerCase().trim())}.json`;
    return key;
}

export async function getCategoryAsync(
    id: string,
    s3Bucket: string
): Promise<CategoryEntity | undefined> {
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
                parent_id: string;
                name: string;
                slug: string;
                description: string;
                created_at: Date;
                updated_at: Date;
                active: boolean;
            };

            const category: CategoryEntity = {
                id: raw.id,
                parent_id: raw.parent_id,
                name: raw.name,
                slug: raw.slug,
                description: raw.description,
                created_at: raw.created_at,
                updated_at: raw.updated_at,
                active: raw.active
            };
            return category;
        }
    }
    catch (e) {
        console.log(`Error getting category: ${e}`);
    }
    return undefined;
}

export async function upsertCategoryAsync(
    category: CategoryEntity,
    s3Bucket: string
): Promise<Boolean> {
    let successfullyCreated: Boolean;
    try {
        const key = buildKey(category.id);
        await amazons3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: JSON.stringify(category),
                ContentType: "application/json",
            })
        );
        successfullyCreated = true;
    }
    catch (e) {
        console.log(`Error creating category: ${e}`);
        successfullyCreated = false;
    }
    return successfullyCreated;
}