import { httpPublic } from "../http-public";
import type { DefaultResponse } from "../response/types";
import type {
  Event,
  EventDetail,
  ListEventsParams,
} from "./types";

export async function getEventBySlug(
  slug: string,
  opts?: { signal?: AbortSignal }
): Promise<EventDetail> {
  const { data } = await httpPublic.get<DefaultResponse<EventDetail>>(
    `/public/event/${encodeURIComponent(slug)}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar evento.");
  }
  throw new Error("Resposta inválida do serviço de eventos.");
}

export async function getRelatedEventsBySlug(
  slug: string,
  opts?: { signal?: AbortSignal }
): Promise<EventDetail> {
  const { data } = await httpPublic.get<DefaultResponse<EventDetail>>(
    `/public/event/related/${encodeURIComponent(slug)}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar evento.");
  }
  throw new Error("Resposta inválida do serviço de eventos.");
}

/**
 * GET /public/event?skip=0&take=10&search=...
 * Retorna o array de eventos (Event[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listEvent(
  params: ListEventsParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Event[]> {
  const { skip = 0, take = 10, fromDate = null, categoryId = null, search } = params;

  const { data } = await httpPublic.get<DefaultResponse<Event[]>>(
    "/public/event",
    {
      params: { skip, take, name: search, fromDate, categoryId },
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
      data.errors.find(Boolean) || "Não foi possível carregar as eventos.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de eventos.");
}