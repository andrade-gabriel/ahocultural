// packages/app/src/api/location/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type { Location, LocationDetail, ListLocationsParams } from "./types";

export async function getLocationById(
  id: number,                                // <- era string
  opts?: { signal?: AbortSignal }
): Promise<LocationDetail> {
  const { data } = await httpAuth.get<DefaultResponse<LocationDetail>>(
    `/admin/location/${encodeURIComponent(String(id))}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data) {
    // Garantir formatos numéricos/arrays
    const d = data.data as any;
    return {
      id: Number(d.id),
      cityId: Number(d.cityId ?? 0),
      stateId: Number(d.stateId ?? 0),
      countryId: Number(d.countryId ?? 0),
      description: String(d.description ?? ""),
      active: Boolean(d.active),
      districts: Array.isArray(d.districts)
        ? d.districts.map((x: any) => ({
            id: Number(x.id ?? 0),
            district: String(x.district ?? ""),
            slug: String(x.slug ?? "")
          }))
        : [],
    };
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar localização.");
  }
  throw new Error("Resposta inválida do serviço de localizações.");
}

export async function insertLocation(
  payload: LocationDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  // O server espera { cityId, description, active, districts[] }
  const body = {
    cityId: Number(payload.cityId),
    description: String(payload.description ?? ""),
    active: Boolean(payload.active),
    districts: (payload.districts ?? []).map(d => ({
      district: String(d.district ?? ""),
      slug: String(d.slug ?? "")
    }))
  };

  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/location`,
    body,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar localização.");
  }
  throw new Error("Resposta inválida ao salvar localização.");
}

export async function updateLocation(
  id: number,                                 // <- era string
  payload: LocationDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const body = {
    cityId: Number(payload.cityId),
    description: String(payload.description ?? ""),
    active: Boolean(payload.active),
    districts: (payload.districts ?? []).map(d => ({
      district: String(d.district ?? ""),
      slug: String(d.slug ?? "")
    }))
  };

  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/location/${encodeURIComponent(String(id))}`,
    body,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar localização.");
  }
  throw new Error("Resposta inválida ao salvar localização.");
}

/**
 * GET /admin/location?skip=0&take=10&city=...
 * Retorna Location[] (id, country, state, city, active)
 */
export async function listLocations(
  params: ListLocationsParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Location[]> {
  const { skip = 0, take = 10, search } = params;

  // No server, o filtro é por cidade (c.name LIKE ...) — use `city`
  // (Se sua rota ainda espera `name`, troque 'city' por 'name')
  const { data } = await httpAuth.get<DefaultResponse<any[]>>(
    "/admin/location",
    {
      params: { skip, take, name: search ?? undefined },
      signal: opts?.signal,
    }
  );

  if (data?.success === true && Array.isArray(data.data)) {
    return data.data.map((r: any): Location => ({
      id: Number(r.id),
      country: String(r.country ?? ""),
      state: String(r.state ?? ""),
      city: String(r.city ?? ""),
      active: Boolean(r.active),
    }));
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    const msg =
      data.errors.find(Boolean) || "Não foi possível carregar as localizações.";
    throw new Error(msg);
  }

  throw new Error("Resposta inválida do serviço de localizações.");
}

/**
 * PATCH /admin/location/:id  { active: boolean }
 */
export async function updateLocationActivity(
  id: number,                                  // <- era string
  active: boolean,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.patch<DefaultResponse<boolean>>(
    `/admin/location/${encodeURIComponent(String(id))}`,
    { active: Boolean(active) },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors.find(Boolean) || "Falha ao atualizar localização.");
  }

  throw new Error("Resposta inválida ao atualizar localização.");
}
