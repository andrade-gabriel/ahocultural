import { HeadObjectCommandOutput } from "@aws-sdk/client-s3";
import { FileProperty } from "./types";

export function toFileProperty(
    key: string,
    config: any,
    head: HeadObjectCommandOutput
): FileProperty {
    const contentType = head.ContentType || "application/octet-stream";
    const size = head.ContentLength ?? 0;
    const etag = head.ETag || null;
    const lastModified = head.LastModified?.toISOString() ?? null;
    const cacheControl = head.CacheControl || null;

    const url = `${config.cdn.url}/${encodeURI(key)}`
    return {
        url
        , name: key
        , size: size
        , contentType
        , etag
        , lastModified
        , cacheControl
    }
}