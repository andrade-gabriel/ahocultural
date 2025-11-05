import { httpPublic } from "../http-public";
import type { DefaultResponse } from "../response/types";
import type {
  About
} from "./types";

export async function getAbout(opts?: { signal?: AbortSignal }): Promise<About> {
  const { data } = await httpPublic.get<DefaultResponse<About>>(
    `/public/about`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar quem-somos.");
  }
  throw new Error("Resposta inválida do serviço de quem-somos.");
}