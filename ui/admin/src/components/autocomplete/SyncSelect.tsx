// SyncSelect.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SyncSelectProps<T> = {
  load: (signal?: AbortSignal) => Promise<T[]>;
  getOptionLabel: (item: T) => string;
  getOptionValue: (item: T) => string;
  value: string | null;
  onChange: (value: string | null, item: T | null) => void;
  placeholder?: string;
  disabled?: boolean;
  filter?: (term: string, item: T) => boolean;
  minChars?: number;
  allowClear?: boolean;
  emptyLabel?: string;
  className?: string;
};

export function SyncSelect<T>({
  load,
  getOptionLabel,
  getOptionValue,
  value,
  onChange,
  placeholder = "Selecionar...",
  disabled,
  filter,
  minChars = 0,
  allowClear = true,
  emptyLabel = "Sem resultados",
  className,
}: SyncSelectProps<T>) {
  const [all, setAll] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const acRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const ensureLoad = useCallback(async () => {
    if (all.length) return;
    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;
    setLoading(true);
    setError(null);
    try {
      const rows = await load(ac.signal);
      setAll(rows ?? []);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [all.length, load]);

  useEffect(() => {
    ensureLoad();
    return () => acRef.current?.abort();
  }, [ensureLoad]);

  const selected = useMemo(
    () =>
      value == null
        ? null
        : all.find((i) => getOptionValue(i) === value) ?? null,
    [all, value, getOptionValue]
  );

  useEffect(() => {
    if (selected) setQuery(getOptionLabel(selected));
  }, [selected, getOptionLabel]);

  const items = useMemo(() => {
    const term = query.trim().toLowerCase();
    const list = all;
    if (!term || term.length < minChars) return list;
    if (filter) return list.filter((i) => filter(term, i));
    return list.filter((i) =>
      getOptionLabel(i).toLowerCase().includes(term)
    );
  }, [all, query, minChars, filter, getOptionLabel]);

  const handleSelect = useCallback(
    (item: T | null) => {
      if (!item) {
        onChange(null, null);
        setQuery("");
        setOpen(false);
        return;
      }
      const v = getOptionValue(item);
      onChange(v, item);
      setQuery(getOptionLabel(item));
      setOpen(false);
    },
    [getOptionLabel, getOptionValue, onChange]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
        setOpen(true);
        setActiveIndex(0);
        return;
      }
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const pick = items[activeIndex] ?? items[0];
        if (pick) handleSelect(pick);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [open, items, activeIndex, handleSelect]
  );

  useEffect(() => {
    const onClickOutside = (ev: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(ev.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="syncselect-listbox"
          aria-activedescendant={
            open && activeIndex >= 0 ? `syncselect-opt-${activeIndex}` : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 pr-10 text-sm shadow-sm outline-none transition focus:border-zinc-500 disabled:cursor-not-allowed disabled:bg-zinc-100"
        />

        {allowClear && (value || query) && !disabled && (
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-1 text-zinc-500 hover:bg-zinc-100"
            aria-label="Limpar"
          >
            ×
          </button>
        )}

        {loading && (
          <span
            aria-hidden
            className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 animate-pulse text-xs text-zinc-400"
          >
            carregando…
          </span>
        )}

        {error && (
          <span
            title={error}
            className="pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-xs text-red-600"
          >
            !
          </span>
        )}
      </div>

      {open && !disabled && (
        <ul
          id="syncselect-listbox"
          role="listbox"
          className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg"
        >
          {items.length === 0 && (
            <li className="select-none px-3 py-2 text-sm text-zinc-500">
              {emptyLabel}
            </li>
          )}

          {items.map((it, idx) => {
            const v = getOptionValue(it);
            const lbl = getOptionLabel(it);
            const active = idx === activeIndex;
            const selected = value != null && v === value;

            return (
              <li
                key={v}
                id={`syncselect-opt-${idx}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault(); // evita blur antes do click
                  handleSelect(it);
                }}
                className={[
                  "cursor-pointer select-none rounded-lg px-3 py-2 text-sm",
                  active ? "bg-zinc-100" : "",
                  selected ? "font-semibold" : "",
                ].join(" ")}
              >
                {lbl}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SyncSelect;