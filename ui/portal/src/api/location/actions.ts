import { httpPublic } from "../http-public";
import type { DefaultResponse } from "../response/types";
import type {
  Location
  , ListLocationsParams
} from "./types";

/**
 * GET /public/category?skip=0&take=10&search=...
 * Retorna o array de categorias (Category[]).
 * Lança erro amigável se a API responder success:false ou payload inválido.
 */
export async function listLocations(
  params: ListLocationsParams = {},
  opts?: { signal?: AbortSignal }
): Promise<Location[]> {
  const { skip = 0, take = 10, search } = params;

  const { data } = await httpPublic.get<DefaultResponse<Location[]>>(
    "/public/location",
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
      data.errors.find(Boolean) || "Não foi possível carregar os pontos de referência.";
    throw new Error(msg);
  }

  // fallback para payload inesperado
  throw new Error("Resposta inválida do serviço de pontos de referência.");
}