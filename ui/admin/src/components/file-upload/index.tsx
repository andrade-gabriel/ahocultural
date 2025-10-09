// src/components/file/FileUpload.tsx
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePresignedUploader } from "@/hooks/usePresignedUploader";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  const rules = accept.split(",").map(r => r.trim().toLowerCase());
  const mime = (file.type || "").toLowerCase();
  const name = file.name.toLowerCase();
  return rules.some(rule => {
    if (rule.startsWith(".")) return name.endsWith(rule);
    if (rule.endsWith("/*")) return mime.startsWith(rule.slice(0, -1));
    return mime === rule;
  });
}

type PreviewData = { url: string; name?: string; size?: number; contentType?: string };

type Props = {
  accept?: string;
  maxSizeMB?: number;
  value?: string | null;                       // id salvo no form
  onChange?: (val: string | null) => void;
  name?: string;
  onBlur?: () => void;
  className?: string;
  /** callback para resolver URL de preview quando value já existe */
  loadPreview?: (id: string) => Promise<PreviewData>;
};

type SelectedFile = {
  fileName: string;
  size?: number;
  previewUrl?: string | null;
  status: "idle" | "uploading" | "done" | "error";
  pct: number;
  error?: string | null;
  resultId?: string | null;
  fromExisting?: boolean; // indica que veio do value inicial
};

export const FileUpload = forwardRef<HTMLInputElement, Props>(
  ({ accept, maxSizeMB, value, onChange, name, onBlur, className, loadPreview }, ref) => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [uiError, setUiError] = useState<string | null>(null);
    const [item, setItem] = useState<SelectedFile | null>(null);
    const { upload, progress, cancel } = usePresignedUploader();

    // quando o campo já vem preenchido, carrega preview
    useEffect(() => {
      let alive = true;
      (async () => {
        if (!value) {
          // se limparam o campo externamente, limpe o item
          setItem(prev => (prev?.fromExisting ? null : prev));
          return;
        }
        // já existe id mas nenhum item carregado
        if (!item && loadPreview) {
          try {
            const p = await loadPreview(value);
            if (!alive) return;
            setItem({
              fileName: p.name ?? `arquivo (${value})`,
              size: p.size,
              previewUrl: p.url,
              status: "done",
              pct: 100,
              resultId: value,
              fromExisting: true,
            });
          } catch {
            // se não conseguir URL, ainda assim mostre o id
            if (!alive) return;
            setItem({
              fileName: `ID: ${value}`,
              status: "done",
              pct: 100,
              resultId: value,
              fromExisting: true,
            });
          }
        }
      })();
      return () => { alive = false; };
    }, [value, loadPreview, item]);

    const pick = (e?: React.MouseEvent) => {
      e?.preventDefault(); e?.stopPropagation();
      fileInputRef.current?.click();
    };

    const handleFiles = async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUiError(null);

      const file = files[0];
      if (!matchesAccept(file, accept)) {
        setUiError(`Tipo de arquivo não permitido. Aceitos: ${accept}`);
        return;
      }
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        setUiError(`Arquivo excede ${maxSizeMB} MB`);
        return;
      }

      const isImage = file.type.startsWith("image/");
      const previewUrl = isImage ? URL.createObjectURL(file) : null;

      setItem({ fileName: file.name, size: file.size, previewUrl, status: "idle", pct: 0 });

      try {
        setItem(old => (old ? { ...old, status: "uploading", pct: 0 } : old));
        const res = await upload(file);
        setItem(old => (old ? { ...old, status: "done", pct: 100, resultId: res.id, fromExisting: false } : old));
        onChange?.(res.id);
      } catch (e: any) {
        setItem(old => (old ? { ...old, status: "error", error: e?.message ?? "Falha no upload" } : old));
      }
    };

    useEffect(() => {
      setItem(old => (old && old.status === "uploading" ? { ...old, pct: progress } : old));
    }, [progress]);

    useEffect(() => {
      return () => {
        if (item?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      };
    }, [item?.previewUrl]);

    const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    };

    const clearItem = () => {
      if (item?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
      setItem(null);
      setUiError(null);
      onChange?.(null);
    };

    const subtitle = useMemo(() => {
      if (item) {
        const size = item.size ? ` • ${formatBytes(item.size)}` : "";
        return `${item.fileName}${size}`;
      }
      if (value) return `ID: ${value}`;
      return null;
    }, [item, value]);

    return (
      <div className={cn("w-full min-w-0 space-y-2", className)}>
        {/* input real de arquivo */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
          onBlur={onBlur}
        />
        {/* input hidden controlado p/ RHF */}
        <input ref={ref} type="hidden" name={name} value={value ?? ""} readOnly />

        {/* Dropzone (só quando não há item) */}
        {!item && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={pick}
            className="w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer"
          >
            Arraste e solte aqui, ou <span className="underline">clique para escolher</span>.
            {accept && <div className="text-sm mt-2 text-muted-foreground">Tipos aceitos: {accept}</div>}
            {maxSizeMB && <div className="text-xs mt-1 text-muted-foreground">Limite: {maxSizeMB} MB</div>}
            {value && <div className="text-xs mt-2 text-muted-foreground">Valor atual: {value}</div>}
          </div>
        )}

        {/* Item (existente ou novo) */}
        {item && (
          <div className="mt-1 w-full border rounded-xl p-3 flex items-center gap-3 overflow-hidden">
            <div className="w-14 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center shrink-0">
              {/* se previewUrl é imagem (pública/assinada) ou blob local, mostra */}
              {item.previewUrl ? (
                <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-xs text-muted-foreground">Arquivo</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{subtitle}</div>

              {item.status === "uploading" && (
                <div className="mt-2">
                  <Progress value={item.pct} />
                  <div className="text-xs text-muted-foreground mt-1">{item.pct}%</div>
                </div>
              )}

              {item.status === "done" && (
                <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                  <Check className="w-4 h-4" /> Enviado • id: {item.resultId}
                </div>
              )}

              {item.status === "error" && (
                <div className="mt-2 text-sm text-red-600">{item.error ?? "Falha no upload"}</div>
              )}
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              {item.status === "uploading" ? (
                <Button type="button" variant="ghost" size="sm" onClick={cancel}>
                  Cancelar
                </Button>
              ) : (
                <>
                  <Button type="button" variant="secondary" size="sm" onClick={pick}>
                    Trocar
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearItem}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {uiError && <div className="mt-1 text-sm text-red-600">{uiError}</div>}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

function formatBytes(n: number) {
  if (!n) return "0 B";
  const u = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / Math.pow(1024, i)).toFixed(1)} ${u[i]}`;
}