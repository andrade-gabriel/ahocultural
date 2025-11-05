import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { UserEntity } from "./types";

/** Constant Properties */
const DEFAULT_PREFIX = "users";
const amazons3Client = new S3Client({
    region: 'us-east-1'
});

export function buildKey(
    email: string
): string {
    const key = `${DEFAULT_PREFIX}/${encodeURIComponent(email.toLowerCase().trim())}.json`;
    return key;
}

export async function getUserAsync(
    email: string,
    s3Bucket: string
): Promise<UserEntity | undefined>
{
    const Key = buildKey(email);
    try
    {
        const res = await amazons3Client.send(
            new GetObjectCommand({ 
                Bucket: s3Bucket
                , Key 
            })
        );
        const text = await (res.Body as any)?.transformToString?.();
        if (text)
        {
            const raw = JSON.parse(text) as {
                email: string;
                firstName: string;
                createdAt: Date;
                updatedAt: Date;
                password: string;
                active: boolean;
            };
            return {
                email: raw.email,
                firstName: raw.firstName,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
                password: raw.password,
                active: raw.active
            }
        }
    }
    catch(e)
    {
        console.log(`Error getting user: ${e}`);
    }
    return undefined;
}

export async function upsertUserAsync(
  user: UserEntity,
  s3Bucket: string
): Promise<Boolean> {
    let successfullyCreated: Boolean;
    try
    {
        const key = buildKey(user.email);
        await amazons3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: JSON.stringify(user),
                ContentType: "application/json",
            })
        );
        successfullyCreated = true;
    }
    catch(e)
    {
        console.log(`Error creating user: ${e}`);
        successfullyCreated = false;
    }
    return successfullyCreated;
}