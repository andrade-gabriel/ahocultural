import {
    S3Client,
    HeadObjectCommand,
    CopyObjectCommand
} from "@aws-sdk/client-s3";
import { extension } from "mime-types";
import { SeoImageType } from "./types";

const DEFAULT_PREFIX = "assets";
const amazons3Client = new S3Client({ region: "us-east-1" });

/** Monta o nome final com base no slug, tipo e content-type */
export function buildKey(
    slug: string,
    assetType: SeoImageType,
    contentType: string
): string {
    const suffix =
        assetType === SeoImageType.Hero
            ? "hero"
            : assetType === SeoImageType.Thumbnail
                ? "thumbnail"
                : "file";

    const ext = extension(contentType) || "bin";
    return `${encodeURIComponent(
        slug.toLowerCase().trim()
    )}_${suffix}.${ext}`;
}

/** 
 * Renameia um arquivo no S3 (id temporário -> nome definitivo)
 * e troca a tag 'temp=true' para 'temp=false'
 */
export async function renameAndFinalizeAsset(params: {
    bucket: string;
    id: string;
    slug: string;
    assetType: SeoImageType;
}) {
    const { bucket, id, slug, assetType } = params;
    if (id.indexOf('assets/') === -1) {
        try {
            const sourceKey = `${DEFAULT_PREFIX}/${id}`;
            const head = await amazons3Client.send(
                new HeadObjectCommand({ Bucket: bucket, Key: sourceKey })
            );

            if (!head.ContentType) {
                throw new Error("Não foi possível determinar o content-type do arquivo.");
            }

            const finalKey = buildKey(slug, assetType, head.ContentType);
            await amazons3Client.send(
                new CopyObjectCommand({
                    Bucket: bucket,
                    CopySource: `${bucket}/${sourceKey}`,
                    Key: `${DEFAULT_PREFIX}/${finalKey}`,
                    MetadataDirective: "REPLACE",
                    ContentType: head.ContentType,
                    TaggingDirective: "REPLACE",
                    Tagging: "temp=false",
                })
            );
            return finalKey;
        } catch (err: any) {
            console.error("name:", err.name);
            console.error("$metadata:", err.$metadata);

            if (err.$response?.body) {
                const text = await streamToString(err.$response.body);
                console.error("S3 error body XML:", text); // aqui normalmente vem <Code>AccessDenied</Code> ou <Code>SignatureDoesNotMatch</Code>
            }
            throw err;
        }
    }
    return id;
}

function streamToString(stream: any): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });
}