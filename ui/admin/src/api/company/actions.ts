// packages/app/src/api/company/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type {
  Company,
  CompanyDetail,
  ListCompaniesParams,
} from "./types";

export async function getCompanyById(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<CompanyDetail> {
  const { data } = await httpAuth.get<DefaultResponse<CompanyDetail>>(
    `/admin/company/${encodeURIComponent(id)}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar empresa.");
  }
  throw new Error("Resposta inválida do serviço de empresas.");
}

export async function insertCompany(
  payload: CompanyDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/company`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
  {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar empresa.");
  }
  throw new Error("Resposta inválida ao salvar empresa.");
}

export async function updateCompany(
  id: string,
  payload: CompanyDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/company/${encodeURIComponent(id)}`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar empresa.");
  }
  throw new Error("Resposta inválida ao salvar empresa.");
}

/**
 * GET /admin/company?skip=0&take=10&search=...
 * Retorna o array de empresas (Company[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listCompanies(
  params: ListCompaniesParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Company[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpAuth.get<DefaultResponse<Company[]>>(
    "/admin/company",
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
      data.errors.find(Boolean) || "Não foi possível carregar as empresas.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de empresas.");
}

/**
 * PATCH /admin/company/:id  { active: boolean }
 * Resposta: { success: true, data: true }
 */
export async function updateCompanyActivity(
  id: number,
  active: boolean,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.patch<DefaultResponse<boolean>>(
    `/admin/company/${encodeURIComponent(id)}`,
    { active },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors.find(Boolean) || "Falha ao atualizar empresa.");
  }

  throw new Error("Resposta inválida ao atualizar empresa.");
}
