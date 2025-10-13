import { httpPublic } from "../http-public";
import type { DefaultResponse } from "../response/types";
import type {
  Category
  , ListCategoriesParams
} from "./types";

/**
 * GET /public/category?skip=0&take=10&search=...
 * Retorna o array de categorias (Category[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listCategories(
  params: ListCategoriesParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Category[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpPublic.get<DefaultResponse<Category[]>>(
    "/public/category",
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

export async function listCategoryChildren(
  parentId: string,
  params: ListCategoriesParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Category[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpPublic.get<DefaultResponse<Category[]>>(
    `/public/category/${parentId}/children`,
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