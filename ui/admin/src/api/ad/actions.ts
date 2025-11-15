// packages/app/src/api/ad/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type {
  AnyAd,
  AdListItem,
  ListAdsParams,
} from "./types";

/**
 * GET /admin/ad/:id
 * Retorna o detalhe completo do Ad (AnyAd).
 */
export async function getAdById(
  id: number,
  opts?: { signal?: AbortSignal }
): Promise<AnyAd> {
  const { data } = await httpAuth.get<DefaultResponse<AnyAd>>(
    `/admin/ad/${encodeURIComponent(String(id))}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar anúncio.");
  }

  throw new Error("Resposta inválida do serviço de anúncios.");
}

/**
 * POST /admin/ad
 * Body: AnyAd (sem id ou com id ignorado pelo backend)
 * Resposta: { success: true, data: true }
 */
export async function insertAd(
  payload: AnyAd,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    "/admin/ad",
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true) {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar anúncio.");
  }

  throw new Error("Resposta inválida ao salvar anúncio.");
}

/**
 * PUT /admin/ad/:id
 * Body: AnyAd
 * Resposta: { success: true, data: true }
 */
export async function updateAd(
  id: number,
  payload: AnyAd,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/ad/${encodeURIComponent(String(id))}`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar anúncio.");
  }

  throw new Error("Resposta inválida ao salvar anúncio.");
}

/**
 * GET /admin/ad?skip=0&take=10&name=...
 * Retorna o array de anúncios (AdListItem[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listAd(
  params: ListAdsParams = {},
  opts?: { signal?: AbortSignal }
): Promise<AdListItem[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpAuth.get<DefaultResponse<AdListItem[]>>(
    "/admin/ad",
    {
      params: { skip, take, name: search },
      signal: opts?.signal,
    }
  );

  // success:true + data:Array => OK
  if (data?.success === true && Array.isArray(data.data)) {
    return data.data;
  }

  // success:false + errors => erro claro
  if (data?.success === false && Array.isArray(data.errors)) {
    const msg =
      data.errors.find(Boolean) || "Não foi possível carregar os anúncios.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de anúncios.");
}

/**
 * PATCH /admin/ad/:id  { active: boolean }
 * Resposta: { success: true, data: true }
 */
export async function updateAdActivity(
  id: number,
  active: boolean,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.patch<DefaultResponse<boolean>>(
    `/admin/ad/${encodeURIComponent(String(id))}`,
    { active },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(
      data.errors.find(Boolean) || "Falha ao atualizar anúncio."
    );
  }

  throw new Error("Resposta inválida ao atualizar anúncio.");
}