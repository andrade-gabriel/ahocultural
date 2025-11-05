import { randomUUID } from 'node:crypto';
import { config } from './config'
import { DefaultResponse } from '@utils/response/types';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { extension } from "mime-types";
import { APIGatewayProxyEvent } from 'aws-lambda';
import { toFileProperty } from 'domain/file/mapper';

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_ASSETS = config.s3.bucket;

export async function handlePreSignedUrl(
    event: APIGatewayProxyEvent
): Promise<DefaultResponse> {
    const body = event.body ? JSON.parse(event.body) : {};
    const { contentType } = body;

    try {
        const ext = extension(contentType);
        const filename = `${randomUUID()}.${ext}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_ASSETS,
            Key: `assets/${filename}`,
            ContentType: contentType,
            ACL: 'private',
            Tagging: 'temp=true', // opcional: marca como temporário pro TTL
        });

        // Presigned URL valid for 5 minutes
        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        return {
            success: true,
            data: {
                id: filename,
                url: uploadUrl
            }
        }
    }
    catch (e) {
        return {
            success: false,
            errors: ["Failed to generate Presigned Url"]
        }
    }
}

export async function getPreview(
    event: APIGatewayProxyEvent
): Promise<DefaultResponse> {
    const id: string | undefined = event.pathParameters?.id;
    if (id) {
        const key = `assets/${id}`; 
        const head = await s3Client.send(new HeadObjectCommand({
            Bucket: BUCKET_ASSETS
            , Key: key
        }));
        if(head)
        {
            return {
                success: true,
                data: toFileProperty(key, config, head)
            };
        }
        return {
            success: true,
            data: null
        };
    }

    return {
        success: false,
        errors: ["O campo `id` deve ser preenchido"]
    };
}