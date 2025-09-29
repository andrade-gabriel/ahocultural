// indexClient.ts
import { CompanyIndex } from "./types";
import { config } from './config'

// AWS SDK v3 – assinatura SigV4
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";

const bate_path = `${config.elasticsearch.domain}/${config.elasticsearch.company_index}`;
const base_url = bate_path.startsWith("http") ? bate_path : `https://${bate_path}`;

async function signedFetchEs(url: URL, method: string, bodyObj?: unknown) {
    const body = bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined;

    const signer = new SignatureV4({
        service: "es", // OpenSearch Service usa 'es' para SigV4
        region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
        credentials: defaultProvider(),
        sha256: Sha256 as any,
    });

    // Usa HttpRequest tipado (evita o erro de TS)
    const req = new HttpRequest({
        protocol: url.protocol,
        hostname: url.hostname, // not host
        method,
        path: (url.pathname || "/") + (url.search || ""),
        headers: {
            host: url.host,
            "content-type": "application/json",
        },
        body,
    });

    const signed = await signer.sign(req); // tem 'headers'
    return fetch(url.toString(), {
        method,
        headers: signed.headers as any,
        body,
    });
}

export async function getAsync(skip: number, take: number, name: string): Promise<CompanyIndex[]> {
    // Monta a URL para /_search do índice
    const url = new URL(`${base_url}/_search`);

    const query = name
    ? { match: { name: name } }
    : { match_all: {} };
    
    // Corpo da busca com paginação simples
    const body = {
        from: skip,
        size: take,
        query
    };

    const resp = await signedFetchEs(url, "POST", body);

    if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Elasticsearch search failed: ${resp.status} - ${text}`);
    }

    type EsSearchResponse<T> = {
        hits?: {
            hits?: Array<{ _source?: T }>;
        };
    };

    const json = (await resp.json()) as EsSearchResponse<CompanyIndex>;

    const results =
        json?.hits?.hits?.map(h => h._source).filter((x): x is CompanyIndex => !!x) ?? [];

    return results;
}
