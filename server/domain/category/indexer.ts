// indexClient.ts
import { CategoryIndex } from "./types";

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

export async function getCategoryByIdAsync(
  config: any,
  id: string
): Promise<CategoryIndex | null> {
  if (!id) return null;

  const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.categoryIndex}`;
  const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;

  // _source => retorna somente o documento, sem metadados
  const url = new URL(`${base_url}/_source/${encodeURIComponent(id)}`);

  const resp = await signedFetchEs(url, "GET");

  // Not found
  if (resp.status === 404) return null;

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Elasticsearch get by id failed: ${resp.status} - ${text}`);
  }

  // O _source já vem "puro" como JSON do seu CategoryIndex
  const doc = (await resp.json()) as CategoryIndex | undefined;
  return doc ?? null;
}


export async function getCategoryBySlugAsync(
    config: any,
    slug: string
): Promise<CategoryIndex | null> {
    if (!slug)
        return null;

    const normalized = slug.trim().toLowerCase();

    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.categoryIndex}`;
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

    const json = (await resp.json()) as EsSearchResponse<CategoryIndex>;
    const hit = json?.hits?.hits?.[0]?._source;

    return hit ?? null;
}

// Busca categorias pelo parent_id com paginação (robusto p/ parent_id ou parent_id.keyword)
export async function getChildrenAsync(
  config: any,
  parentId: string,
  skip: number = 0,
  take: number = 20
): Promise<CategoryIndex[]> {
  if (!parentId || !parentId.trim()) {
    throw new Error("`parentId` é obrigatório.");
  }

  const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.categoryIndex}`;
  const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
  const url = new URL(`${base_url}/_search`);

  const query = {
    bool: {
      // usamos filter (não afeta score) e tentamos ambos os campos
      filter: [
        {
          bool: {
            should: [
              { term: { "parent_id": parentId } },
              { term: { "parent_id.keyword": parentId } },
            ],
            minimum_should_match: 1,
          },
        },
      ],
    },
  };

  const body = {
    from: skip,
    size: take,
    track_total_hits: false,
    query,
    sort: [
      { "name.keyword": { order: "asc", unmapped_type: "keyword" } },
      { "updated_at": { order: "desc", unmapped_type: "date" } },
    ],
  };

  const resp = await signedFetchEs(url, "POST", body);

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Elasticsearch search by parent failed: ${resp.status} - ${text}`);
  }

  type EsSearchResponse<T> = { hits?: { hits?: Array<{ _source?: T }> } };
  const json = (await resp.json()) as EsSearchResponse<CategoryIndex>;

  const results =
    json?.hits?.hits?.map((h) => h._source).filter((x): x is CategoryIndex => !!x) ?? [];

  return results;
}


export async function getAsync(config: any, skip: number, take: number, onlyParents: boolean, name: string | null): Promise<CategoryIndex[]> {
    // Monta a URL para /_search do índice
    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.categoryIndex}`;
    const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
    const url = new URL(`${base_url}/_search`);

    const baseFilter =
        name && name.trim() !== ""
            ? {
                wildcard: {
                    "name.keyword": {
                        value: `*${name.toLowerCase().replace(/([*?])/g, '\\$1')}*`,
                        case_insensitive: true,
                    },
                },
            }
            : { match_all: {} };

    const mustNot = onlyParents ? [{ exists: { field: "parent_id" } }] : [];
    const query = {
        bool: {
            ...(baseFilter.match_all ? {} : { must: [baseFilter] }),
            must_not: mustNot,
        },
    };

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

    const json = (await resp.json()) as EsSearchResponse<CategoryIndex>;

    const results =
        json?.hits?.hits?.map(h => h._source).filter((x): x is CategoryIndex => !!x) ?? [];

    return results;
}


export async function postAsync(config: any, doc: CategoryIndex): Promise<boolean> {
    if (!doc?.id)
        throw new Error("`id` é obrigatório.");

    // Monta a URL para /_search do índice
    const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.categoryIndex}`;
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