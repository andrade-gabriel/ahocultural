// packages/app/src/api/location/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type { Country, State, City, ViaCepAddress } from "./types";

export async function getCountries(
  opts?: { signal?: AbortSignal }
): Promise<Country[]> {
  const { data } = await httpAuth.get<DefaultResponse<Country[]>>(
    `/admin/geo/country`,
    { signal: opts?.signal }
  );

  if (data?.success === true && Array.isArray(data.data)) {
    return data.data.map((r: any): Country => ({
      id: Number(r.id),
      name: String(r.name ?? ""),
      iso2: String(r.iso2 ?? ""),
      slug: String(r.slug ?? "")
    }));
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar países.");
  }
  throw new Error("Resposta inválida do serviço de geolocalização.");
}

export async function getStatesByCountryId(
  id: number,
  opts?: { signal?: AbortSignal }
): Promise<State[]> {
  const { data } = await httpAuth.get<DefaultResponse<State[]>>(
    `/admin/geo/state/${encodeURIComponent(String(id))}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && Array.isArray(data.data)) {
    return data.data.map((r: any): State => ({
      id: Number(r.id),
      country_id: Number(r.country_id ?? '0'),
      name: String(r.name ?? ""),
      uf: String(r.uf ?? ""),
      slug: String(r.slug ?? "")
    }));
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar estados.");
  }
  throw new Error("Resposta inválida do serviço de geolocalização.");
}

export async function getCitiesByStateId(
  id: number,
  opts?: { signal?: AbortSignal }
): Promise<City[]> {
  const { data } = await httpAuth.get<DefaultResponse<City[]>>(
    `/admin/geo/city/${encodeURIComponent(String(id))}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && Array.isArray(data.data)) {
    return data.data.map((r: any): City => ({
      id: Number(r.id),
      state_id: Number(r.state_id ?? '0'),
      name: String(r.name ?? ""),
      slug: String(r.slug ?? "")
    }));
  }

  console.log('e', data)

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar estados.");
  }
  throw new Error("Resposta inválida do serviço de geolocalização.");
}

export async function getGeoByAddress(
  address: { street: string; number?: string; district?: string; city: string; state: string; country?: string },
  opts?: { signal?: AbortSignal }
): Promise<{ lat: number; lng: number } | null> {
  const q = [
    address.street,
    address.number && `, ${address.number}`,
    address.district,
    address.city && `, ${address.city}`,
    address.state && `, ${address.state}`,
    address.country ?? 'Brasil',
  ]
    .filter(Boolean)
    .join(', ');

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;

  const res = await fetch(url, {
    signal: opts?.signal,
    headers: {
      'User-Agent': 'linktou-geocoder/1.0 (gabriel@linktou.com.br)',
      'Accept-Language': 'pt-BR',
    },
  });

  if (!res.ok) throw new Error(`Falha ao consultar Nominatim (${res.status})`);
  const data = await res.json();

  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    return {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
    };
  }

  return null;
}

export async function getAddressByCep(
  cep: string,
  opts?: { signal?: AbortSignal }
): Promise<ViaCepAddress> {
  const cleanCep = (cep || '').replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    throw new Error('CEP inválido. Use o formato 00000-000.');
  }

  const url = `https://viacep.com.br/ws/${cleanCep}/json/`;
  const res = await fetch(url, {
    signal: opts?.signal,
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Falha ao consultar ViaCEP (${res.status})`);
  }

  const data = await res.json();

  if (data.erro) {
    throw new Error('CEP não encontrado na base do ViaCEP.');
  }

  return {
    cep: data.cep ?? cleanCep,
    street: data.logradouro ?? '',
    district: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
    ibge: data.ibge ?? undefined,
    gia: data.gia ?? undefined,
    ddd: data.ddd ?? undefined,
  };
}