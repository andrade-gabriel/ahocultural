import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { AboutEntity } from "./types";

/** Constant Properties */
const DEFAULT_PREFIX = "institutional";
const amazons3Client = new S3Client({
    region: 'us-east-1'
});

export function buildKey(): string {
    const key = `${DEFAULT_PREFIX}/about.json`;
    return key;
}

export async function getAboutAsync(s3Bucket: string): Promise<AboutEntity | undefined> {
    const Key = buildKey();
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
                body: {
                    pt: string;
                    en: string;
                    es: string;
                };
            };

            const item: AboutEntity = {
                body: {
                    pt: raw.body.pt,
                    en: raw.body.en,
                    es: raw.body.es
                }
            };
            return item;
        }
    }
    catch (e) {
        console.log(`Error getting item: ${e}`);
    }
    return undefined;
}

export async function upsertAboutAsync(
    item: AboutEntity,
    s3Bucket: string
): Promise<Boolean> {
    let successfullyCreated: Boolean;
    try {
        const key = buildKey();
        await amazons3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: JSON.stringify(item),
                ContentType: "application/json",
            })
        );
        successfullyCreated = true;
    }
    catch (e) {
        console.log(`Error creating item: ${e}`);
        successfullyCreated = false;
    }
    return successfullyCreated;
}