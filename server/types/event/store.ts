import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { EventEntity } from "./types";

/** Constant Properties */
const DEFAULT_PREFIX = "events";
const amazons3Client = new S3Client({
    region: 'us-east-1'
});

export function buildKey(
    slug: string
): string {
    const key = `${DEFAULT_PREFIX}/${encodeURIComponent(slug.toLowerCase().trim())}.json`;
    return key;
}

export async function getEventAsync(
    id: string,
    s3Bucket: string
): Promise<EventEntity | undefined> {
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
                title: string;
                slug: string;
                category: string;
                imageUrl: string;
                body: string;
                startDate: Date;
                endDate: Date;
                location: string;
                pricing: number;
                facilities: string[];
                sponsored: boolean;
                created_at: Date;
                updated_at: Date;
                active: boolean;
            };

            const location: EventEntity = {
                id: raw.id,
                title: raw.title,
                slug: raw.slug,
                category: raw.category,
                imageUrl: raw.imageUrl,
                body: raw.body,
                startDate: raw.startDate,
                endDate: raw.endDate,
                location: raw.location,
                pricing: raw.pricing,
                facilities: raw.facilities,
                sponsored: raw.sponsored,
                created_at: raw.created_at,
                updated_at: raw.updated_at,
                active: raw.active
            };
            return location;
        }
    }
    catch (e) {
        console.log(`Error getting location: ${e}`);
    }
    return undefined;
}

export async function upsertEventAsync(
    location: EventEntity,
    s3Bucket: string
): Promise<Boolean> {
    let successfullyCreated: Boolean;
    try {
        const key = buildKey(location.id);
        await amazons3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: JSON.stringify(location),
                ContentType: "application/json",
            })
        );
        successfullyCreated = true;
    }
    catch (e) {
        console.log(`Error creating location: ${e}`);
        successfullyCreated = false;
    }
    return successfullyCreated;
}