import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { LocationEntity } from "./types";

/** Constant Properties */
const DEFAULT_PREFIX = "locations";
const amazons3Client = new S3Client({
    region: 'us-east-1'
});

export function buildKey(
    slug: string
): string {
    const key = `${DEFAULT_PREFIX}/${encodeURIComponent(slug.toLowerCase().trim())}.json`;
    return key;
}

export async function getLocationAsync(
    id: string,
    s3Bucket: string
): Promise<LocationEntity | undefined> {
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
                country: string;
                countrySlug: string;
                state: string;
                stateSlug: string;
                city: string;
                citySlug: string;
                districtsAndSlugs: Record<string, string>;
                description: string;
                created_at: Date;
                updated_at: Date;
                active: boolean;
            };

            const location: LocationEntity = {
                id: raw.id,
                country: raw.country,
                countrySlug: raw.countrySlug,
                state: raw.state,
                stateSlug: raw.countrySlug,
                city: raw.city,
                citySlug: raw.citySlug,
                districtsAndSlugs: raw.districtsAndSlugs,
                description: raw.description,
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

export async function upsertLocationAsync(
    location: LocationEntity,
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