// components/StrictAsyncCombobox.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronsUpDown, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverTrigger, PopoverContent,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";

export type Option = { value: string; label: string };

function useDebounced<T>(v: T, ms = 250) {
  const [x, setX] = useState(v);
  useEffect(() => { const t = setTimeout(() => setX(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return x;
}

type Props = {
  value: string | null;                              // ID selecionado (controlado)
  onChange: (v: string | null) => void;              // grava ID no form
  fetchOptions: (q: string, signal?: AbortSignal) => Promise<Option[]>;
  resolveById?: (id: string, signal?: AbortSignal) => Promise<Option | null>; // para edição
  placeholder?: string;
  disabled?: boolean;
  emptyLabel?: string; // texto quando não há resultados
};

export function StrictAsyncCombobox({
  value, onChange, fetchOptions, resolveById, placeholder = "Selecionar...",
  disabled, emptyLabel = "Nenhum resultado",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = useDebounced(query, 250);
  const [loading, setLoading] = useState(false);
  const [opts, setOpts] = useState<Option[]>([]);
  const [selected, setSelected] = useState<Option | null>(null);
  const acRef = useRef<AbortController | null>(null);

  // quando vier um ID (edição), resolve o label
  useEffect(() => {
    if (!value) { setSelected(null); return; }
    if (selected?.value === value) return;
    if (!resolveById) return;

    acRef.current?.abort();
    const ac = new AbortController(); acRef.current = ac;
    resolveById(value, ac.signal)
      .then(opt => setSelected(opt))
      .catch(() => setSelected(null));

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // busca remota ao digitar
  useEffect(() => {
    if (!open) return;
    // if (!q.trim()) { setOpts([]); return; }

    acRef.current?.abort();
    const ac = new AbortController(); acRef.current = ac;

    setLoading(true);
    fetchOptions(q, ac.signal)
      .then(list => setOpts(list))
      .catch(() => setOpts([]))
      .finally(() => setLoading(false));

    return () => ac.abort();
  }, [q, open, fetchOptions]);

  // abrir fecha popover e gerencia query
  const onOpenChange = useCallback((o: boolean) => {
    setOpen(o);
    if (o) {
      // ao abrir, começa filtrando pelo label atual
      setQuery(selected?.label ?? "");
    } else {
      // ao fechar: se não houve seleção válida, mantém ou limpa (valor fica vazio se nunca selecionou)
      if (!selected) onChange(null);
      setQuery("");
      setOpts([]);
      setLoading(false);
    }
  }, [selected, onChange]);

  function handleSelect(opt: Option) {
    setSelected(opt);
    onChange(opt.value);   // grava ID no form
    setOpen(false);
  }

  function clearSelection(e: React.MouseEvent) {
    e.stopPropagation();
    setSelected(null);
    onChange(null);        // campo vazio
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          <span className={`truncate ${selected ? "" : "text-muted-foreground"}`}>
            {selected ? selected.label : placeholder}
          </span>
          <div className="flex items-center gap-1">
            {selected && (
              <X
                className="h-4 w-4 opacity-70 hover:opacity-100"
                onClick={clearSelection}
                aria-label="Limpar seleção"
              />
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput
              value={query}
              onValueChange={(v : any) => setQuery(v)}
              placeholder="Buscar..."
            />
            {loading && <Loader2 className="absolute right-2 top-2 h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <CommandList>
            {!loading && opts.length === 0 && <CommandEmpty>{emptyLabel}</CommandEmpty>}

            {opts.length > 0 && (
              <CommandGroup>
                {opts.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.label}
                    onSelect={() => handleSelect(o)}
                  >
                    <Check className={`mr-2 h-4 w-4 ${selected?.value === o.value ? "opacity-100" : "opacity-0"}`} />
                    {o.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}