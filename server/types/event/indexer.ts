// indexClient.ts
import { EventIndex } from "./types";

// AWS SDK v3 – assinatura SigV4
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";

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

export async function getBySlugAsync(
    config: any,
    slug: string
): Promise<EventIndex | null> {
    if (!slug)
        return null;

    const normalized = slug.trim().toLowerCase();

    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.eventIndex}`;
    const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
    const url = new URL(`${base_url}/_search`);

    const resp = await signedFetchEs(url, "POST", {
        size: 1,
        track_total_hits: false,
        query: {
            bool: {
                should: [
                    { term: { "slug.keyword": normalized } }
                ],
                minimum_should_match: 1
            }
        },
        sort: [{ "updated_at": { order: "desc" } }]
    });

    if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Elasticsearch search by slug failed: ${resp.status} - ${text}`);
    }

    type EsSearchResponse<T> = {
        hits?: {
            hits?: Array<{ _source?: T }>;
        };
    };

    const json = (await resp.json()) as EsSearchResponse<EventIndex>;
    const hit = json?.hits?.hits?.[0]?._source;

    return hit ?? null;
}

export async function getAsync(config: any, skip: number, take: number, name: string | null): Promise<EventIndex[]> {
    // Monta a URL para /_search do índice
    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.eventIndex}`;
    const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
    const url = new URL(`${base_url}/_search`);

    const query = name
        ? {
            wildcard: {
                "title.keyword": {
                    value: `*${name.toLowerCase().replace(/([*?])/g, '\\$1')}*`,
                    case_insensitive: true
                }
            }
        }
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

    const json = (await resp.json()) as EsSearchResponse<EventIndex>;

    const results =
        json?.hits?.hits?.map(h => h._source).filter((x): x is EventIndex => !!x) ?? [];

    return results;
}


export async function postAsync(config: any, doc: EventIndex): Promise<boolean> {
    if (!doc?.id)
        throw new Error("`id` é obrigatório.");

    // Monta a URL para /_search do índice
    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.eventIndex}`;
    const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;

    const url = new URL(`${base_url}/_doc/${encodeURIComponent(doc.id)}`)
    const res = await signedFetchEs(url, "PUT", doc);

    console.log('url', url);
    console.log('body', JSON.stringify(doc));
    console.log('elastisearch response', res);

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`OpenSearch index failed: ${res.status} ${text}`);
    }

    const data: any = await res.json().catch(() => ({}));
    return data?.result === "created" || data?.result === "updated";
}

export async function getRelatedEventsBySlugCatLocDateAsync(
    config: any,
    slug: string,
    size: number = 4
): Promise<EventIndex[]> {
    if (!slug) return [];

    const index = config?.elasticsearch?.eventIndex;
    if (!index) throw new Error("Missing config.elasticsearch.eventIndex");

    // 1) Carrega base
    const base = await getBySlugAsync(config, slug);
    if (!base?.id || !base?.category || !base?.location) return [];

    const base_path = `${config.elasticsearch.domain}/${index}`;
    const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
    const url = new URL(`${base_url}/_search`);

    // -------- Fase 1: futuros/rolando (filtra por data) --------
    const nowMinus1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const body1 = {
        size,
        track_total_hits: false,
        query: {
            bool: {
                filter: [
                    { term: { "category.keyword": base.category } },
                    { term: { "location.keyword": base.location } },
                    { term: { active: true } },
                    { range: { startDate: { gte: nowMinus1h } } }
                ],
                must_not: [{ term: { "id": base.id } }] // id é keyword puro
            }
        },
        sort: [
            { sponsored: { order: "desc", unmapped_type: "boolean" } },
            { startDate: { order: "asc", unmapped_type: "date" } },
            { updated_at: { order: "desc", unmapped_type: "date" } }
        ],
        _source: [
            "id", "title", "slug", "category", "location", "company",
            "heroImage", "thumbnail", "startDate", "endDate",
            "pricing", "facilities", "sponsored", "active", "updated_at"
        ]
    };

    const resp1 = await signedFetchEs(url, "POST", body1);
    if (!resp1.ok) {
        const text = await resp1.text().catch(() => "");
        throw new Error(`OpenSearch related (phase 1) failed: ${resp1.status} - ${text}`);
    }
    const json1 = await resp1.json() as { hits?: { hits?: Array<{ _source?: EventIndex }> } };
    const firstBatch =
        json1?.hits?.hits?.map(h => h._source).filter((x): x is EventIndex => !!x) ?? [];

    if (firstBatch.length >= size) {
        // Defesa extra contra o próprio id (por segurança)
        return firstBatch.filter(x => x.id !== base.id).slice(0, size);
    }

    // -------- Fase 2: fallback por proximidade de data do base (gauss) --------
    // Caso não tenha startDate no base, pula fallback gauss e retorna o que houver
    if (!base.startDate) {
        return firstBatch.filter(x => x.id !== base.id).slice(0, size);
    }

    const missing = size - firstBatch.length;

    const body2 = {
        size: missing,
        track_total_hits: false,
        query: {
            function_score: {
                query: {
                    bool: {
                        filter: [
                            { term: { "category.keyword": base.category } },
                            { term: { "location.keyword": base.location } },
                            { term: { active: true } },
                            { exists: { field: "startDate" } }
                        ],
                        must_not: [
                            { term: { "id": base.id } },
                            ...firstBatch.map(ev => ({ term: { "id": ev.id } })) // evita repetidos
                        ]
                    }
                },
                functions: [
                    {
                        gauss: {
                            startDate: {
                                origin: base.startDate, // centraliza na data do evento base
                                scale: "14d",           // janela de proximidade (ajuste conforme)
                                offset: "0d",
                                decay: 0.5
                            }
                        }
                    }
                ],
                score_mode: "multiply",
                boost_mode: "sum"
            }
        },
        sort: [
            { _score: { order: "desc" } },
            { startDate: { order: "asc", unmapped_type: "date" } },
            { updated_at: { order: "desc", unmapped_type: "date" } }
        ],
        _source: [
            "id", "title", "slug", "category", "location", "company",
            "heroImage", "thumbnail", "startDate", "endDate",
            "pricing", "facilities", "sponsored", "active", "updated_at"
        ]
    };

    const resp2 = await signedFetchEs(url, "POST", body2);
    if (!resp2.ok) {
        const text = await resp2.text().catch(() => "");
        throw new Error(`OpenSearch related (phase 2) failed: ${resp2.status} - ${text}`);
    }
    const json2 = await resp2.json() as { hits?: { hits?: Array<{ _source?: EventIndex }> } };
    const secondBatch =
        json2?.hits?.hits?.map(h => h._source).filter((x): x is EventIndex => !!x) ?? [];

    const merged = [...firstBatch, ...secondBatch]
        .filter(x => x.id !== base.id)
        .slice(0, size);

    return merged;
}