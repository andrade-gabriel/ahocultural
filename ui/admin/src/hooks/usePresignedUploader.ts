// src/hooks/usePresignedUploader.ts
import { useCallback, useRef, useState } from "react";
import { getPreSignedUrl } from "@/api/file/actions";

export type UploadResult = { id: string; etag?: string | null };

export function usePresignedUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const abortRef = useRef<XMLHttpRequest | null>(null);

  const upload = useCallback(async (file: File): Promise<UploadResult> => {
    setIsUploading(true);
    setProgress(0);

    try {
      // 1) pede URL pré-assinada informando o content-type
      const { id, url } = await getPreSignedUrl(file.type);

      // 2) PUT com o mesmo Content-Type usado ao assinar
      const etag = await new Promise<string | null>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        abortRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded * 100) / e.total);
            setProgress(pct);
          }
        };

        xhr.onerror = () => reject(new Error("Falha de rede no upload"));
        xhr.onabort = () => reject(new Error("Upload cancelado"));
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            // S3 costuma devolver ETag no header (exposto via CORS)
            resolve(xhr.getResponseHeader("ETag"));
          } else {
            reject(new Error(`Upload falhou (${xhr.status})`));
          }
        };

        xhr.open("PUT", url);
        xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
        xhr.send(file);
      });

      setProgress(100);
      setIsUploading(false);
      return { id, etag: etag ?? null };
    } catch (err) {
      setIsUploading(false);
      setProgress(0);
      throw err;
    } finally {
      abortRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { upload, isUploading, progress, cancel };
}