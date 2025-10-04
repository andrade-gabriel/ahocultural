// packages/app/src/api/event/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type {
  Event,
  EventDetail,
  ListEventsParams,
} from "./types";

export async function getEventById(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<EventDetail> {
  const { data } = await httpAuth.get<DefaultResponse<EventDetail>>(
    `/admin/event/${encodeURIComponent(id)}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar evento.");
  }
  throw new Error("Resposta inválida do serviço de eventos.");
}

export async function insertEvent(
  payload: EventDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/event`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
  {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar evento.");
  }
  throw new Error("Resposta inválida ao salvar evento.");
}

export async function updateEvent(
  id: string,
  payload: EventDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/event/${encodeURIComponent(id)}`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar evento.");
  }
  throw new Error("Resposta inválida ao salvar evento.");
}

/**
 * GET /admin/event?skip=0&take=10&search=...
 * Retorna o array de eventos (Event[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listEvent(
  params: ListEventsParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Event[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpAuth.get<DefaultResponse<Event[]>>(
    "/admin/event",
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
      data.errors.find(Boolean) || "Não foi possível carregar as eventos.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de eventos.");
}

/**
 * PATCH /admin/event/:id  { active: boolean }
 * Resposta: { success: true, data: true }
 */
export async function updateEventActivity(
  id: string,
  active: boolean,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.patch<DefaultResponse<boolean>>(
    `/admin/event/${encodeURIComponent(id)}`,
    { active },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors.find(Boolean) || "Falha ao atualizar evento.");
  }

  throw new Error("Resposta inválida ao atualizar evento.");
}
