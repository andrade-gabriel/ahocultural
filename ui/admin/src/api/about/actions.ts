// packages/app/src/api/about/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type { About } from "./types";

export async function getAboutById(opts?: { signal?: AbortSignal }): Promise<About> {
  const { data } = await httpAuth.get<DefaultResponse<About>>(
    `/admin/about`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar quem-somos.");
  }
  throw new Error("Resposta inválida do serviço de quem-somoss.");
}

export async function insertAbout(
  payload: About,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/about`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
  {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar quem-somos.");
  }
  throw new Error("Resposta inválida ao salvar quem-somos.");
}

export async function updateAbout(payload: About, opts?: { signal?: AbortSignal }): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/about`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar quem-somos.");
  }
  throw new Error("Resposta inválida ao salvar quem-somos.");
}