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
                category: string;
                company: string;
                heroImage: string;
                thumbnail: string;
                body: {
                    pt: string;
                    en: string;
                    es: string;
                };
                startDate: Date;
                endDate: Date;
                pricing: number;
                externalTicketLink: string;
                facilities: string[];
                sponsored: boolean;
                created_at: Date;
                updated_at: Date;
                active: boolean;
                recurrence?: {
                    rrule: string;
                    until: Date;
                    exdates?: Date[];
                    rdates?: Date[];
                };
            };

            const event: EventEntity = {
                id: raw.id,
                title: {
                    pt: raw.title.pt,
                    en: raw.title.en,
                    es: raw.title.es,
                },
                slug: {
                    pt: raw.slug.pt,
                    en: raw.slug.en,
                    es: raw.slug.es,
                },
                company: raw.company,
                category: raw.category,
                heroImage: raw.heroImage,
                thumbnail: raw.thumbnail,
                body: {
                    pt: raw.body.pt,
                    en: raw.body.en,
                    es: raw.body.es,
                },
                startDate: raw.startDate,
                endDate: raw.endDate,
                pricing: raw.pricing,
                externalTicketLink: raw.externalTicketLink,
                facilities: raw.facilities,
                sponsored: raw.sponsored,
                created_at: raw.created_at,
                updated_at: raw.updated_at,
                active: raw.active,
                recurrence: raw.recurrence ? {
                    rrule: raw.recurrence.rrule,
                    until: raw.recurrence.until,
                    exdates: raw.recurrence.exdates,
                    rdates: raw.recurrence.rdates
                } : undefined
            };
            return event;
        }
    }
    catch (e) {
        console.log(`Error getting event: ${e}`);
    }
    return undefined;
}

export async function upsertEventAsync(
    event: EventEntity,
    s3Bucket: string
): Promise<Boolean> {
    let successfullyCreated: Boolean;
    try {
        const key = buildKey(event.id);
        await amazons3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: JSON.stringify(event),
                ContentType: "application/json",
            })
        );
        successfullyCreated = true;
    }
    catch (e) {
        console.log(`Error creating event: ${e}`);
        successfullyCreated = false;
    }
    return successfullyCreated;
}