// packages/app/src/api/studio/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type { Studio } from "./types";

export async function getStudioById(opts?: { signal?: AbortSignal }): Promise<Studio> {
  const { data } = await httpAuth.get<DefaultResponse<Studio>>(
    `/admin/studio`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar studio.");
  }
  throw new Error("Resposta inválida do serviço de studio.");
}

export async function insertStudio(
  payload: Studio,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/studio`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
  {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar studio.");
  }
  throw new Error("Resposta inválida ao salvar studio.");
}

export async function updateStudio(payload: Studio, opts?: { signal?: AbortSignal }): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/studio`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar studio.");
  }
  throw new Error("Resposta inválida ao salvar studio.");
}