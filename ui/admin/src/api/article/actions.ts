// packages/app/src/api/article/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type {
  Article,
  ArticleDetail,
  ListArticlesParams,
} from "./types";

export async function getArticleById(
  id: string,
  opts?: { signal?: AbortSignal }
): Promise<ArticleDetail> {
  const { data } = await httpAuth.get<DefaultResponse<ArticleDetail>>(
    `/admin/article/${encodeURIComponent(id)}`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar matéria.");
  }
  throw new Error("Resposta inválida do serviço de matérias.");
}

export async function insertArticle(
  payload: ArticleDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.post<DefaultResponse<boolean>>(
    `/admin/article`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
  {
    return true;
  }

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar matéria.");
  }
  throw new Error("Resposta inválida ao salvar matéria.");
}

export async function updateArticle(
  id: string,
  payload: ArticleDetail,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.put<DefaultResponse<boolean>>(
    `/admin/article/${encodeURIComponent(id)}`,
    payload,
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true)
    return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar matéria.");
  }
  throw new Error("Resposta inválida ao salvar matéria.");
}

/**
 * GET /admin/article?skip=0&take=10&search=...
 * Retorna o array de matérias (Article[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listArticle(
  params: ListArticlesParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Article[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpAuth.get<DefaultResponse<Article[]>>(
    "/admin/article",
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
      data.errors.find(Boolean) || "Não foi possível carregar as matérias.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de matérias.");
}

/**
 * PATCH /admin/article/:id  { active: boolean }
 * Resposta: { success: true, data: true }
 */
export async function updateArticleActivity(
  id: string,
  active: boolean,
  opts?: { signal?: AbortSignal }
): Promise<boolean> {
  const { data } = await httpAuth.patch<DefaultResponse<boolean>>(
    `/admin/article/${encodeURIComponent(id)}`,
    { active },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true && data.data === true) return true;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors.find(Boolean) || "Falha ao atualizar matéria.");
  }

  throw new Error("Resposta inválida ao atualizar matéria.");
}
