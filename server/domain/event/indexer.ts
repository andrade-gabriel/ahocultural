// indexClient.ts
import { EventIndex } from "./types";

// AWS SDK v3 – assinatura SigV4
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { HttpRequest } from "@aws-sdk/protocol-http";

/* ============================================================
 * Helpers
 * ============================================================ */

function buildBaseUrl(config: any): string {
  const base_path = `${config.elasticsearch.domain}/${config.elasticsearch.eventIndex}`;
  return base_path.startsWith("http") ? base_path : `https://${base_path}`;
}

/**
 * Assina e envia requisições para o OpenSearch (AWS SigV4).
 * - Aceita body como objeto (JSON) ou string (NDJSON para /_bulk).
 * - Monta path/query corretamente para a assinatura (query não fica no path).
 * - Usa hostname no header Host (sem porta).
 * - Define content-type adequado (JSON vs NDJSON).
 */
async function signedFetchEs(url: URL, method: string, bodyInput?: unknown) {
  // 1) Normaliza body e content-type
  let body: string | undefined;
  let contentType = "application/json";

  if (typeof bodyInput === "string") {
    // NDJSON ou JSON já serializado
    body = bodyInput;
    // Heurística simples: vários \n geralmente indicam NDJSON (_bulk)
    if (body.includes("\n")) contentType = "application/x-ndjson";
  } else if (bodyInput !== undefined) {
    body = JSON.stringify(bodyInput);
    contentType = "application/json";
  }

  // 2) Extrai query em objeto (não concatenar no path)
  const query: Record<string, string | string[]> = {};
  for (const [k, v] of url.searchParams.entries()) {
    if (query[k] === undefined) query[k] = v;
    else {
      const cur = query[k];
      query[k] = Array.isArray(cur) ? [...cur, v] : [cur as string, v];
    }
  }

  const signer = new SignatureV4({
    service: "es", // OpenSearch Service usa 'es'
    region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1",
    credentials: defaultProvider(),
    sha256: Sha256 as any,
  });

  const req = new HttpRequest({
    protocol: url.protocol,     // "https:"
    hostname: url.hostname,     // sem porta
    method,
    path: url.pathname || "/",  // NUNCA inclua a query aqui
    query: Object.keys(query).length ? query : undefined,
    headers: {
      host: url.hostname,       // use hostname (ex.: search-xxx.es.amazonaws.com)
      "content-type": contentType,
    },
    body,
  });

  const signed = await signer.sign(req);

  // Envia exatamente o que foi assinado
  return fetch(url.toString(), {
    method,
    headers: signed.headers as any,
    body,
  });
}

/* ============================================================
 * Bulk Upsert
 * ============================================================ */

export async function bulkUpsertAsync(
  config: any,
  docs: EventIndex[]
): Promise<boolean> {
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error("`docs` must be a non-empty array.");
  }

  const base_url = buildBaseUrl(config);
  const url = new URL(`${base_url}/_bulk`);

  // Monta NDJSON (action + source) — action 'index' funciona como upsert
  const ndjson =
    docs
      .map((doc) => {
        // usamos esId como _id no índice
        const esId = (doc as any).esId as string | undefined;
        if (!esId) throw new Error("`esId` is required for all documents.");
        const action = { index: { _id: esId } };
        return JSON.stringify(action) + "\n" + JSON.stringify(doc);
      })
      .join("\n") + "\n";

  const res = await signedFetchEs(url, "POST", ndjson);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenSearch bulk upsert failed: ${res.status} ${text}`);
  }

  const data: any = await res.json().catch(() => ({}));

  // Se qualquer item falhar, `errors` vem true
  if (data?.errors) {
    // Log mínimo dos erros de itens
    console.error(
      "Bulk upsert contained errors:",
      data.items?.filter((i: any) => i.index?.error)
    );
    return false;
  }

  return true;
}

/* ============================================================
 * Get by slug
 * ============================================================ */

export async function getBySlugAsync(
  config: any,
  slug: string
): Promise<EventIndex | null> {
  if (!slug) return null;

  const normalized = slug.trim().toLowerCase();

  const base_url = buildBaseUrl(config);
  const url = new URL(`${base_url}/_search`);

  const resp = await signedFetchEs(url, "POST", {
    size: 1,
    track_total_hits: false,
    query: {
      bool: {
        should: [{ term: { "slug.keyword": normalized } }],
        minimum_should_match: 1,
      },
    },
    sort: [{ updated_at: { order: "desc" } }],
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Elasticsearch search by slug failed: ${resp.status} - ${text}`);
  }

  type EsSearchResponse<T> = {
    hits?: { hits?: Array<{ _source?: T }> };
  };

  const json = (await resp.json()) as EsSearchResponse<EventIndex>;
  const hit = json?.hits?.hits?.[0]?._source;

  return hit ?? null;
}

/* ============================================================
 * Busca paginada com filtros
 * ============================================================ */

export async function getAsync(
  config: any,
  skip: number,
  take: number,
  name: string | null,
  fromDate?: string | Date | null,
  categoryId?: string | string[] | null
): Promise<EventIndex[]> {
  const base_url = buildBaseUrl(config);
  const url = new URL(`${base_url}/_search`);

  const must: any[] = [];
  const filter: any[] = [];

  if (name && name.trim() !== "") {
    const value = `*${name.toLowerCase().replace(/([*?])/g, "\\$1")}*`;
    must.push({
      wildcard: { "title.keyword": { value, case_insensitive: true } },
    });
  }

  if (categoryId && (Array.isArray(categoryId) ? categoryId.length : true)) {
    const ids = (Array.isArray(categoryId) ? categoryId : [categoryId]).filter(Boolean) as string[];
    filter.push({
      bool: {
        should: [
          { terms: { "category.keyword": ids } },
          { terms: { "parentCategory.keyword": ids } },
        ],
        minimum_should_match: 1,
      },
    });
  }

  const nowIso = new Date().toISOString();
  const gteIso =
    fromDate instanceof Date
      ? fromDate.toISOString()
      : fromDate
      ? new Date(fromDate).toISOString()
      : nowIso;

  if (!Number.isNaN(new Date(gteIso).getTime())) {
    filter.push({ range: { startDate: { gte: gteIso } } });
  }

  filter.push({ term: { active: true } });

  const query =
    must.length || filter.length
      ? { bool: { ...(must.length ? { must } : {}), ...(filter.length ? { filter } : {}) } }
      : { match_all: {} };

  const body: any = {
    from: skip,
    size: take,
    track_total_hits: false,
    query,
    sort: [
      { startDate: { order: "asc", unmapped_type: "date" } },
      { sponsored: { order: "desc", unmapped_type: "boolean" } },
      { updated_at: { order: "desc", unmapped_type: "date" } },
    ],
    // >>> AQUI: colapsa por `id` (keyword)
    collapse: {
      field: "id",
      inner_hits: {
        name: "proximas",
        size: 1,
        sort: [{ startDate: { order: "asc" } }],
        _source: false,
      },
    },
    _source: true,
  };

  const resp = await signedFetchEs(url, "POST", body);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Elasticsearch search failed: ${resp.status} - ${text}`);
  }

  type EsHit<T> = { _source?: T };
  type EsResponse<T> = { hits?: { hits?: Array<EsHit<T>> } };
  const json = (await resp.json()) as EsResponse<EventIndex>;
  return json?.hits?.hits?.map(h => h._source).filter((x): x is EventIndex => !!x) ?? [];
}

/* ============================================================
 * Index (single doc) - upsert por _id
 * ============================================================ */

export async function postAsync(config: any, doc: EventIndex): Promise<boolean> {
  if (!doc?.id) throw new Error("`id` é obrigatório.");

  const esId = (doc as any).esId as string | undefined;
  if (!esId) throw new Error("`esId` é obrigatório.");

  const base_url = buildBaseUrl(config);
  const url = new URL(`${base_url}/_doc/${encodeURIComponent(esId)}`);

  const res = await signedFetchEs(url, "PUT", doc);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenSearch index failed: ${res.status} ${text}`);
  }

  const data: any = await res.json().catch(() => ({}));
  return data?.result === "created" || data?.result === "updated";
}

/* ============================================================
 * Delete-by-query: remove SOMENTE futuras ocorrências da série
 * ============================================================ */

export async function deleteByQueryAsync(
  config: any,
  seriesId: string
): Promise<boolean> {
  if (!seriesId) throw new Error("`seriesId` é obrigatório.");

  const base_url = buildBaseUrl(config);
  const url = new URL(`${base_url}/_delete_by_query`);
  url.searchParams.set("routing", seriesId);
  url.searchParams.set("conflicts", "proceed");
  url.searchParams.set("wait_for_completion", "true");

  const now = new Date().toISOString();

  const body = {
    query: {
      bool: {
        must: [
          { term: { id: seriesId } },          // mesma série
          { range: { startDate: { gte: now } } } // apenas futuras
        ]
      }
    }
  };

  const res = await signedFetchEs(url, "POST", body);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenSearch delete-by-query failed: ${res.status} ${text}`);
  }

  return true;
}

/* ============================================================
 * Relacionados por slug + mesma localização (e não o mesmo id)
 * ============================================================ */

export async function getRelatedEventsBySlugCatLocDateAsync(
  config: any,
  slug: string,
  size: number = 4
): Promise<EventIndex[]> {
  if (!slug) return [];

  const index = config?.elasticsearch?.eventIndex;
  if (!index) throw new Error("Missing config.elasticsearch.eventIndex");

  // pega o evento base para extrair location e id
  const base = await getBySlugAsync(config, slug);
  if (!base?.id || !(base as any)?.location) return [];

  const base_url = buildBaseUrl(config);
  const url = new URL(`${base_url}/_search`);

  // Se quiser só futuros, habilite o range
  // const nowIso = new Date().toISOString();

  const body = {
    size,
    track_total_hits: false,
    query: {
      bool: {
        filter: [
          { term: { "location.keyword": (base as any).location } },
          { term: { active: true } },
          // { range: { startDate: { gte: nowIso } } } // opcional: somente futuros
        ],
        must_not: [{ term: { id: base.id } }],
      },
    },
    sort: [
      { startDate: { order: "desc", unmapped_type: "date" } },
      { updated_at: { order: "desc", unmapped_type: "date" } },
    ],
  };

  const resp = await signedFetchEs(url, "POST", body);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`OpenSearch related search failed: ${resp.status} - ${text}`);
  }

  type EsSearchResponse<T> = { hits?: { hits?: Array<{ _source?: T }> } };
  const json = (await resp.json()) as EsSearchResponse<EventIndex>;
  return json?.hits?.hits?.map(h => h._source).filter((x): x is EventIndex => !!x) ?? [];
}
