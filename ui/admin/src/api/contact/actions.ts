// packages/app/src/api/contact/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type { Contact } from "./types";

export async function getContactById(opts?: { signal?: AbortSignal }): Promise<Contact> {
  const { data } = await httpAuth.get<DefaultResponse<Contact>>(
    `/admin/contact`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar quem-somos.");
  }
  throw new Error("Resposta inválida do serviço de quem-somoss.");
}

export async function insertContact(
  payload: Contact,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/contact`,
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

export async function updateContact(payload: Contact, opts?: { signal?: AbortSignal }): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/contact`,
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