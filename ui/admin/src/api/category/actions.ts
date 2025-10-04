// packages/app/src/api/category/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type {
  Category,
  CategoryDetail,
  ListCategorysParams,
} from "./types";

export async function getCategoryById(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<CategoryDetail> {
  const { data } = await httpAuth.get<DefaultResponse<CategoryDetail>>(
    `/admin/category/${encodeURIComponent(id)}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar categoria.");
  }
  throw new Error("Resposta inválida do serviço de categorias.");
}

export async function insertCategory(
  payload: CategoryDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/category`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
  {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar categoria.");
  }
  throw new Error("Resposta inválida ao salvar categoria.");
}

export async function updateCategory(
  id: string,
  payload: CategoryDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/category/${encodeURIComponent(id)}`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar categoria.");
  }
  throw new Error("Resposta inválida ao salvar categoria.");
}

/**
 * GET /admin/category?skip=0&take=10&search=...
 * Retorna o array de categorias (Category[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listCategories(
  params: ListCategorysParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Category[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpAuth.get<DefaultResponse<Category[]>>(
    "/admin/category",
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
      data.errors.find(Boolean) || "Não foi possível carregar as categorias.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de categorias.");
}

/**
 * PATCH /admin/category/:id  { active: boolean }
 * Resposta: { success: true, data: true }
 */
export async function updateCategoryActivity(
  id: string,
  active: boolean,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.patch<DefaultResponse<boolean>>(
    `/admin/category/${encodeURIComponent(id)}`,
    { active },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors.find(Boolean) || "Falha ao atualizar categoria.");
  }

  throw new Error("Resposta inválida ao atualizar categoria.");
}
