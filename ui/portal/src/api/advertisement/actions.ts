import { httpPublic } from "../http-public";
import type { DefaultResponse } from "../response/types";
import type {
  Advertisement
} from "./types";

export async function getAdvertisement(opts?: { signal?: AbortSignal }): Promise<Advertisement> {
  const { data } = await httpPublic.get<DefaultResponse<Advertisement>>(
    `/public/advertisement`,
    { signal: opts?.signal }
  );

  if (data?.success === true && data.data)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao carregar seu-espaco-na-aho.");
  }
  throw new Error("Resposta inválida do serviço de seu-espaco-na-aho.");
}