// packages/app/src/api/location/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type {
  Location,
  LocationDetail,
  ListLocationsParams,
} from "./types";

export async function getLocationById(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<LocationDetail> {
  const { data } = await httpAuth.get<DefaultResponse<LocationDetail>>(
    `/admin/location/${encodeURIComponent(id)}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar localização.");
  }
  throw new Error("Resposta inválida do serviço de localizações.");
}

export async function insertLocation(
  payload: LocationDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/location`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
  {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar localização.");
  }
  throw new Error("Resposta inválida ao salvar localização.");
}

export async function updateLocation(
  id: string,
  payload: LocationDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/location/${encodeURIComponent(id)}`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar localização.");
  }
  throw new Error("Resposta inválida ao salvar localização.");
}

/**
 * GET /admin/location?skip=0&take=10&search=...
 * Retorna o array de localizações (Location[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listLocations(
  params: ListLocationsParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Location[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpAuth.get<DefaultResponse<Location[]>>(
    "/admin/location",
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
      data.errors.find(Boolean) || "Não foi possível carregar as localizações.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de localizações.");
}

/**
 * PATCH /admin/location/:id  { active: boolean }
 * Resposta: { success: true, data: true }
 */
export async function updateLocationActivity(
  id: string,
  active: boolean,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.patch<DefaultResponse<boolean>>(
    `/admin/location/${encodeURIComponent(id)}`,
    { active },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors.find(Boolean) || "Falha ao atualizar localização.");
  }

  throw new Error("Resposta inválida ao atualizar localização.");
}
