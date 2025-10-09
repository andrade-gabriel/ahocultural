// packages/app/src/api/file/actions.ts
import { httpAuth } from "../http-auth";
import type { DefaultResponse } from "../response/types";
import type { FileProperty, PreSignedUrl } from "./types";


export async function getPreSignedUrl(
  contentType: string,
  opts?: { signal?: AbortSignal }
): Promise<PreSignedUrl> {
  const { data } = await httpAuth.post<DefaultResponse<PreSignedUrl>>(
    `/admin/file`,
    {
        "contentType": contentType
    },
    { signal: opts?.signal, headers: { "Content-Type": "application/json" } }
  );

  if (data?.success === true)
    return data.data;

  if (data?.success === false && Array.isArray(data.errors)) {
    throw new Error(data.errors[0] || "Falha ao salvar evento.");
  }
  throw new Error("Resposta inválida ao salvar evento.");
}

export async function getPreviewUrl(id: string) {
  const res = await httpAuth.get<DefaultResponse<FileProperty>>(
    `/admin/file/${id}`
  );
  if (res.data?.success) return res.data.data;
  throw new Error("Falha ao obter preview");
}