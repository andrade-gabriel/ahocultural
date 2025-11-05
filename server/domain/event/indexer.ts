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

/**
 * Busca eventos com paginação e filtros opcionais:
 * - name: busca por substring em title (case-insensitive) via wildcard em title.keyword
 * - fromDate: filtra eventos com startDate >= fromDate (ISO ou Date)
 * - categoryId: filtra por id armazenado em "category" (term em "category.keyword")
 */
export async function getAsync(
  config: any,
  skip: number,
  take: number,
  name: string | null,
  fromDate?: string | Date | null,
  categoryId?: string | string[] | null   // <- aceita string ou string[]
): Promise<EventIndex[]> {
  const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.eventIndex}`;
  const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
  const url = new URL(`${base_url}/_search`);

  const must: any[] = [];
  const filter: any[] = [];

  // --- Nome (wildcard com escaping) ---
  if (name && name.trim() !== "") {
    const value = `*${name.toLowerCase().replace(/([*?])/g, "\\$1")}*`;
    must.push({
      wildcard: {
        "title.keyword": {
          value,
          case_insensitive: true,
        },
      },
    });
  }

  // --- Categoria OU ParentCategory ---
  if (categoryId && (Array.isArray(categoryId) ? categoryId.length : true)) {
    const ids = (Array.isArray(categoryId) ? categoryId : [categoryId]).filter(Boolean) as string[];

    // match em pelo menos um dos campos
    filter.push({
      bool: {
        should: [
          { terms: { "category.keyword": ids } },
          { terms: { "parentCategory.keyword": ids } }, // <- precisa existir no índice
        ],
        minimum_should_match: 1,
      },
    });
  }

  // --- Data "a partir de" ---
  if (fromDate) {
    const gte = fromDate instanceof Date ? fromDate.toISOString() : new Date(fromDate).toISOString();
    if (!Number.isNaN(new Date(gte).getTime())) {
      filter.push({ range: { startDate: { gte } } });
    }
  }

  // Somente ativos
  filter.push({ term: { active: true } });

  const query =
    must.length || filter.length
      ? { bool: { ...(must.length ? { must } : {}), ...(filter.length ? { filter } : {}) } }
      : { match_all: {} };

  const body = {
    from: skip,
    size: take,
    track_total_hits: false,
    query,
    sort: [
      { sponsored: { order: "desc", unmapped_type: "boolean" } },
      { startDate: { order: "asc", unmapped_type: "date" } },
      { updated_at: { order: "desc", unmapped_type: "date" } },
    ],
    _source: true,
  };

  const resp = await signedFetchEs(url, "POST", body);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Elasticsearch search failed: ${resp.status} - ${text}`);
  }

  type EsSearchResponse<T> = { hits?: { hits?: Array<{ _source?: T }> } };
  const json = (await resp.json()) as EsSearchResponse<EventIndex>;
  return json?.hits?.hits?.map(h => h._source).filter((x): x is EventIndex => !!x) ?? [];
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

    // pega o evento "base" para extrair location e id
    const base = await getBySlugAsync(config, slug);
    if (!base?.id || !base?.location) return [];

    const base_path = `${config.elasticsearch.domain}/${index}`;
    const base_url = base_path.startsWith("http") ? base_path : `https://${base_path}`;
    const url = new URL(`${base_url}/_search`);

    // ⚠️ Se você quiser só futuros, descomente o filtro de range.
    // const nowIso = new Date().toISOString();

    const body = {
        size,
        track_total_hits: false,
        query: {
            bool: {
                filter: [
                    { term: { "location.keyword": base.location } },
                    { term: { active: true } },
                    // { range: { startDate: { gte: nowIso } } } // ← opcional: apenas futuros
                ],
                must_not: [{ term: { id: base.id } }],
            },
        },
        sort: [
            { startDate: { order: "desc", unmapped_type: "date" } },
            { updated_at: { order: "desc", unmapped_type: "date" } },
        ]
    };

    const resp = await signedFetchEs(url, "POST", body);
    if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`OpenSearch related search failed: ${resp.status} - ${text}`);
    }

    type EsSearchResponse<T> = { hits?: { hits?: Array<{ _source?: T }> } };
    const json = (await resp.json()) as EsSearchResponse<EventIndex>;

    return (
        json?.hits?.hits?.map(h => h._source).filter((x): x is EventIndex => !!x) ?? []
    );
}