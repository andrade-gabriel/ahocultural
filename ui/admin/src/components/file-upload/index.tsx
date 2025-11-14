// src/components/file/FileUpload.tsx
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { usePresignedUploader } from "@/hooks/usePresignedUploader";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  const rules = accept.split(",").map((r) => r.trim().toLowerCase());
  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1));
    return mime === rule;
  });
}

type PreviewData = {
  name?: string;
  size?: number;
  contentType?: string;
};

type Props = {
  accept?: string;
  maxSizeMB?: number;
  /** Agora o campo guarda N ids de arquivos */
  value?: string[] | null;
  onChange?: (val: string[] | null) => void;
  name?: string;
  onBlur?: () => void;
  className?: string;
  /** callback para resolver nome quando já existe id salvo */
  loadPreview?: (id: string) => Promise<PreviewData>;
  /** URL base para abrir o arquivo: baseUrl + fileName */
  baseUrl?: string;
  /** Limite opcional de arquivos. Ex.: 1 para single, 5 para até 5, undefined = sem limite */
  maxFiles?: number;
};

type FileRow = {
  rowId: string;
  backendId: string;
  fileName: string;
  size?: number;
  isLoading?: boolean;
  url?: string;
};

export const FileUpload = forwardRef<HTMLInputElement, Props>(
  (
    {
      accept,
      maxSizeMB,
      value,
      onChange,
      name,
      onBlur,
      className,
      loadPreview,
      baseUrl,
      maxFiles,
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uiError, setUiError] = useState<string | null>(null);
    const [rows, setRows] = useState<FileRow[]>([]);
    const { upload } = usePresignedUploader();

    const currentIds = Array.isArray(value) ? value : [];
    const currentCount = currentIds.length;
    const hasLimit = typeof maxFiles === "number" && maxFiles > 0;
    const remainingSlots = hasLimit ? Math.max(maxFiles! - currentCount, 0) : Infinity;
    const canAddMore = remainingSlots > 0;

    // monta URL a partir do nome + baseUrl
    const buildUrl = (fileName: string): string | undefined => {
      if (!baseUrl) return undefined;
      // se quiser, dá pra trocar por encodeURIComponent(fileName)
      return `${baseUrl}/${fileName}`;
    };

    // carrega nomes dos arquivos existentes a partir de value
    useEffect(() => {
      let alive = true;
      const ids = Array.isArray(value) ? value : [];

      if (!ids.length) {
        setRows([]);
        return () => {
          alive = false;
        };
      }

      // Sem loadPreview → mostra o id como nome; se tiver baseUrl, usa id como "filename"
      if (!loadPreview) {
        setRows(
          ids.map((id) => {
            const fileName = `${id}`;
            return {
              rowId: id,
              backendId: id,
              fileName,
              isLoading: false,
              url: buildUrl(id), // aqui uso o id porque não tenho filename real
            };
          })
        );
        return () => {
          alive = false;
        };
      }

      // Primeiro: placeholders de "Carregando..."
      setRows(
        ids.map((id) => ({
          rowId: id,
          backendId: id,
          fileName: "Carregando...",
          isLoading: true,
        }))
      );

      // Depois: resolve previews reais
      (async () => {
        const next: FileRow[] = [];

        for (const id of ids) {
          if (!alive) return;

          try {
            const p = await loadPreview(id);
            if (!alive) return;

            const fileName = p.name ?? `${id}`;

            next.push({
              rowId: id,
              backendId: id,
              fileName,
              size: p.size,
              isLoading: false,
              url: buildUrl(fileName),
            });
          } catch {
            if (!alive) return;

            const fallbackName = `${id}`;

            next.push({
              rowId: id,
              backendId: id,
              fileName: fallbackName,
              isLoading: false,
              url: buildUrl(fallbackName),
            });
          }
        }

        if (!alive) return;
        setRows(next);
      })();

      return () => {
        alive = false;
      };
    }, [value, loadPreview, baseUrl]);

    const pick = (e?: MouseEvent<HTMLButtonElement>) => {
      e?.preventDefault();
      e?.stopPropagation();

      // se já atingiu o limite, não abre o picker
      if (!canAddMore && hasLimit) {
        setUiError(
          maxFiles === 1
            ? "Você já selecionou o arquivo máximo permitido."
            : `Você já atingiu o limite de ${maxFiles} arquivos.`
        );
        return;
      }

      fileInputRef.current?.click();
    };

    const handleFilesSelected = async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setUiError(null);

      const selected = Array.from(files);
      const accepted: File[] = [];

      for (const file of selected) {
        if (!matchesAccept(file, accept)) {
          setUiError(`Tipo de arquivo não permitido. Aceitos: ${accept}`);
          continue;
        }
        if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
          setUiError(`Arquivo excede ${maxSizeMB} MB`);
          continue;
        }
        accepted.push(file);
      }

      if (!accepted.length) return;

      const current = Array.isArray(value) ? value : [];
      let allowed: File[] = accepted;

      if (hasLimit) {
        const remaining = maxFiles! - current.length;
        if (remaining <= 0) {
          setUiError(
            maxFiles === 1
              ? "Você já selecionou o arquivo máximo permitido."
              : `Você já atingiu o limite de ${maxFiles} arquivos.`
          );
          return;
        }

        if (accepted.length > remaining) {
          allowed = accepted.slice(0, remaining);
          setUiError(
            maxFiles === 1
              ? "Apenas 1 arquivo é permitido."
              : `Foram selecionados mais arquivos que o permitido. Apenas os primeiros ${remaining} foram considerados.`
          );
        }
      }

      const nextIds = [...current];

      for (const file of allowed) {
        // cria linha temporária "Carregando" para este arquivo
        const tempRowId = `temp-${file.name}-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

        setRows((prev) => [
          ...prev,
          {
            rowId: tempRowId,
            backendId: tempRowId,
            fileName: file.name,
            size: file.size,
            isLoading: true,
          },
        ]);

        try {
          const res = await upload(file); // espera id do backend

          nextIds.push(res.id);

          // atualiza a linha temporária com o id real + url
          setRows((prev) =>
            prev.map((row) =>
              row.rowId === tempRowId
                ? {
                    ...row,
                    backendId: res.id,
                    isLoading: false,
                    url: buildUrl(res.id),
                  }
                : row
            )
          );
        } catch (e: any) {
          setUiError(e?.message ?? "Falha no upload de um dos arquivos");

          // remove linha temporária em caso de erro
          setRows((prev) => prev.filter((row) => row.rowId !== tempRowId));
        }
      }

      onChange?.(nextIds.length ? nextIds : null);
    };

    const handleRemove = (backendId: string) => {
      const current = Array.isArray(value) ? value : [];
      const next = current.filter((id) => id !== backendId);
      onChange?.(next.length ? next : null);
    };

    const labelTitle = maxFiles === 1 ? "Arquivo" : "Arquivos";
    const buttonLabel =
      maxFiles === 1 ? "Selecionar arquivo" : "Adicionar arquivo(s)";

    const normalizedValue = Array.isArray(value) ? value : [];

    return (
      <div className={cn("w-full min-w-0 space-y-2", className)}>
        {/* input real de arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={!hasLimit || maxFiles !== 1}
          onChange={(e) => {
            void handleFilesSelected(e.target.files);
            // permite selecionar o mesmo arquivo de novo
            e.target.value = "";
          }}
          onBlur={onBlur}
        />

        {/* input hidden p/ integração com RHF / forms */}
        <input
          ref={ref}
          type="hidden"
          name={name}
          value={normalizedValue.join(",")}
          readOnly
        />

        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">
            {labelTitle}
            {hasLimit && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({currentCount}/{maxFiles})
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={pick}
            disabled={!canAddMore && hasLimit}
          >
            {buttonLabel}
          </Button>
        </div>

        {/* lista estilo “pasta do Windows”: nome (link) + lixo */}
        <div className="border rounded-md divide-y bg-background">
          {rows.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Nenhum arquivo adicionado
            </div>
          )}

          {rows.map((row) => (
            <div
              key={row.rowId}
              className="flex items-center justify-between px-3 py-1.5 text-sm"
            >
              <span className="truncate">
                {row.isLoading ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="inline-block h-3 w-24 rounded bg-muted animate-pulse" />
                    <span className="text-xs">Carregando…</span>
                  </span>
                ) : row.url ? (
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    title={row.fileName}
                  >
                    {row.fileName}
                  </a>
                ) : (
                  row.fileName
                )}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => handleRemove(row.backendId)}
                aria-label={`Remover ${row.fileName}`}
                disabled={row.isLoading}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {uiError && (
          <div className="mt-1 text-sm text-red-600">{uiError}</div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";
