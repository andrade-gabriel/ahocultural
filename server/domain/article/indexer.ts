// indexClient.ts
import { ArticleIndex } from "./types";

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
): Promise<ArticleIndex | null> {
    if (!slug)
        return null;

    const normalized = slug.trim().toLowerCase();

    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.articleIndex}`;
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

    const json = (await resp.json()) as EsSearchResponse<ArticleIndex>;
    const hit = json?.hits?.hits?.[0]?._source;

    return hit ?? null;
}

export async function getRelatedByDateFromIdAsync(
  config: any,
  slug: string,
  size: number = 4
): Promise<ArticleIndex[]> {
  if (!slug) return [];

  // 1) Artigo base
  const base = await getBySlugAsync(config, slug);
  if (!base?.publicationDate || !base?.id) return [];

  const index = config?.elasticsearch?.articleIndex;
  if (!index) throw new Error("Missing config.elasticsearch.articleIndex");

  const base_path = `${config.elasticsearch.domain}/${index}`;
  const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
  const url = new URL(`${base_url}/_search`);

  // 2) Proximidade por data (gauss) + excluir o próprio ID
  const body = {
    size,
    track_total_hits: false,
    query: {
      function_score: {
        query: {
          bool: {
            filter: [
              { term: { active: true } },
              { exists: { field: "publicationDate" } }
            ],
            // ATENÇÃO: use "id" (keyword), não "id.keyword"
            must_not: [{ term: { "id": base.id } }]
          }
        },
        functions: [
          {
            gauss: {
              publicationDate: {
                origin: base.publicationDate,
                scale: "14d",
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
      { publicationDate: { order: "desc", unmapped_type: "date" } },
      { updated_at: { order: "desc", unmapped_type: "date" } }
    ],
    _source: [
      "id","title","slug","heroImage","thumbnail",
      "publicationDate","active","updated_at"
    ]
  };

  const resp = await signedFetchEs(url, "POST", body);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Elasticsearch related by date (from id) failed: ${resp.status} - ${text}`);
  }

  type EsSearchResponse<T> = { hits?: { hits?: Array<{ _source?: T }> } };
  const json = (await resp.json()) as EsSearchResponse<ArticleIndex>;

  // Defesa final: remove o próprio ID caso algo passe
  const results =
    (json?.hits?.hits?.map(h => h._source).filter((x): x is ArticleIndex => !!x) ?? [])
      .filter(x => x.id !== base.id)
      .slice(0, size);

  return results;
}

export async function getAsync(config: any, skip: number, take: number, name: string | null): Promise<ArticleIndex[]> {
    // Monta a URL para /_search do índice
    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.articleIndex}`;
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

    const json = (await resp.json()) as EsSearchResponse<ArticleIndex>;

    const results =
        json?.hits?.hits?.map(h => h._source).filter((x): x is ArticleIndex => !!x) ?? [];

    return results;
}


export async function postAsync(config: any, doc: ArticleIndex): Promise<boolean> {
    if (!doc?.id)
        throw new Error("`id` é obrigatório.");

    // Monta a URL para /_search do índice
    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.articleIndex}`;
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