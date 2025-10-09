import { randomUUID } from 'node:crypto';
import { config } from './config'
import { DefaultResponse } from '@utils/response/types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { lookup, extension, contentType } from "mime-types";

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_ASSETS = config.s3.bucket;

export async function handlePreSignedUrl(
    contentType: string
): Promise<DefaultResponse> {
    try {
        const ext = extension(contentType);
        const filename = `${randomUUID()}.${ext}`;
        const command = new PutObjectCommand({
            Bucket: BUCKET_ASSETS,
            Key: filename,
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
    catch(e){
        return {
            success: false,
            errors: [ "Failed to generate Presigned Url" ]
        }
    }
}