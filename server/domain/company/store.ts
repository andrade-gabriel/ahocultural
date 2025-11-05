import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import type { CompanyEntity } from "./types";

/** Constant Properties */
const DEFAULT_PREFIX = "companies";
const amazons3Client = new S3Client({
    region: 'us-east-1'
});

export function buildKey(
    slug: string
): string {
    const key = `${DEFAULT_PREFIX}/${encodeURIComponent(slug.toLowerCase().trim())}.json`;
    return key;
}

export async function getCompanyAsync(
    id: string,
    s3Bucket: string
): Promise<CompanyEntity | undefined> {
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
                name: string;
                slug: string;
                address: {
                    street: string;
                    number?: string;
                    complement?: string;
                    district?: string;
                    city: string;
                    state: string;
                    state_full?: string;
                    postal_code?: string;
                    country: string;
                    country_code: string;
                };
                location: string;
                geo: {
                    lat: number | null;
                    lng: number | null;
                };
                created_at: Date;
                updated_at: Date;
                active: boolean;
            };

            const company: CompanyEntity = {
                id: raw.id,
                name: raw.name,
                slug: raw.slug,
                address: {
                    street: raw.address.street,
                    number: raw.address.number,
                    complement: raw.address.complement,
                    district: raw.address.district,
                    city: raw.address.city,
                    state: raw.address.state,
                    state_full: raw.address.state_full,
                    postal_code: raw.address.postal_code,
                    country: raw.address.country,
                    country_code: raw.address.country_code,
                },
                location: raw.location,
                geo: {
                    lat: raw.geo.lat,
                    lng: raw.geo.lng,
                },
                created_at: raw.created_at,
                updated_at: raw.updated_at,
                formatted_address: buildFormattedAddress(raw.address),
                active: raw.active
            };
            return company;
        }
    }
    catch (e) {
        console.log(`Error getting company: ${e}`);
    }
    return undefined;
}

export async function upsertCompanyAsync(
    company: CompanyEntity,
    s3Bucket: string
): Promise<Boolean> {
    let successfullyCreated: Boolean;
    try {
        const key = buildKey(company.id);
        await amazons3Client.send(
            new PutObjectCommand({
                Bucket: s3Bucket,
                Key: key,
                Body: JSON.stringify(company),
                ContentType: "application/json",
            })
        );
        successfullyCreated = true;
    }
    catch (e) {
        console.log(`Error creating company: ${e}`);
        successfullyCreated = false;
    }
    return successfullyCreated;
}

function buildFormattedAddress(address: CompanyEntity["address"]): string {
  const parts: string[] = [];

  if (address.street) {
    parts.push(`${address.street}${address.number ? `, ${address.number}` : ""}`);
  }
  if (address.complement) {
    parts.push(address.complement);
  }
  if (address.district) {
    parts.push(address.district);
  }
  if (address.city && address.state) {
    parts.push(`${address.city} - ${address.state}`);
  } else if (address.city) {
    parts.push(address.city);
  }
  if (address.postal_code) {
    parts.push(address.postal_code);
  }
  if (address.country) {
    parts.push(address.country);
  }

  return parts.join(", ");
}