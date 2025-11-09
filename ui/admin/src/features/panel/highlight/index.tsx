"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type PropsWithChildren,
} from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  listEvent,
  saveHighlightEvents,
  type Event,
} from "@/api/event";

import {
  Card, CardHeader, CardTitle, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw, ChevronLeft, ChevronRight, Star } from "lucide-react";

/* =========================
   Contexto
   ========================= */

type Params = { skip: number; take: number; search?: string };

type HighlightContextShape = {
  items: Event[];
  loading: boolean;
  error?: string;
  selected: Set<string>;
  params: Params;
  hasNextPage: boolean;
  setSearch: (v: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  toggleSelect: (id: string) => void;
  save: () => Promise<void>;
  refresh: () => void;
};

const HighlightContext = createContext<HighlightContextShape | null>(null);

function useHighlightContext() {
  const ctx = useContext(HighlightContext);
  if (!ctx) throw new Error("useHighlightContext deve ser usado dentro de <HighlightProvider />");
  return ctx;
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* =========================
   Provider
   ========================= */

function HighlightProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<Event[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState("");
  const [params, setParams] = useState<Params>({ skip: 0, take: 10 });
  const [hasNextPage, setHasNextPage] = useState(false);

  const debouncedSearch = useDebounced(searchInput, 400);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const reqId = ++requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const data = await listEvent(
        { skip: params.skip, take: params.take, search: debouncedSearch || undefined },
        { signal: ac.signal }
      );
      if (reqId !== requestIdRef.current) return;
      setItems(data);
      setHasNextPage(data.length === params.take);
    } catch (e) {
      if (isAbortError(e)) return;
      const msg = e instanceof Error ? e.message : "Falha ao carregar eventos.";
      setError(msg);
      setItems([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [params.skip, params.take, debouncedSearch]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 16) {
        next.add(id);
      } else {
        toast.warning("Limite atingido (máx. 16 eventos).");
      }
      return next;
    });
  };

  const save = async () => {
    if (selected.size === 0) {
      toast.warning("Selecione pelo menos um evento para destacar.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        version: 1,
        updatedAt: new Date().toISOString(),
        items: Array.from(selected).map((id, idx) => ({ id, weight: idx + 1 })),
        max: 16,
      };
      await saveHighlightEvents(payload);
      toast.success("Destaques atualizados com sucesso!");
    } catch {
      toast.error("Falha ao salvar destaques.");
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo<HighlightContextShape>(
    () => ({
      items,
      loading,
      error,
      selected,
      params,
      hasNextPage,
      setSearch: setSearchInput,
      nextPage: () => setParams((p) => ({ ...p, skip: p.skip + p.take })),
      prevPage: () => setParams((p) => ({ ...p, skip: Math.max(0, p.skip - p.take) })),
      toggleSelect,
      save,
      refresh: fetchData,
    }),
    [items, loading, error, selected, params, hasNextPage, fetchData]
  );

  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
}

function isAbortError(e: unknown) {
  const any = e as any;
  return (
    any?.name === "CanceledError" ||
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}

/* =========================
   UI
   ========================= */

function Toolbar() {
  const { setSearch, refresh, loading, save, selected } = useHighlightContext();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-500" />
        <div>
          <h2 className="text-base font-semibold leading-none">Eventos em Destaque</h2>
          <p className="text-sm text-muted-foreground">
            Selecione até 16 eventos para aparecerem em destaque
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por título..."
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Atualizar
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={loading}
          className="gap-2 bg-amber-500 hover:bg-amber-600"
        >
          Salvar destaques ({selected.size}/16)
        </Button>
      </div>
    </div>
  );
}

function EventsTable() {
  const { items, loading, error, selected, toggleSelect } = useHighlightContext();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao carregar eventos</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Nenhum evento encontrado.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]"></TableHead>
          <TableHead>Título</TableHead>
          <TableHead className="w-[200px]">Data</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((e) => (
          <TableRow
            key={e.id}
            onClick={() => toggleSelect(e.id)}
            className={`cursor-pointer transition-all ${
              selected.has(e.id) ? "bg-amber-50 ring-1 ring-amber-300" : ""
            }`}
          >
            <TableCell>
              <Checkbox checked={selected.has(e.id)} readOnly />
            </TableCell>
            <TableCell className="font-medium">{e.title.pt}</TableCell>
            <TableCell>
              {e.startDate?.toString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Pagination() {
  const { params, hasNextPage, nextPage, prevPage, loading } = useHighlightContext();
  const page = Math.floor(params.skip / params.take) + 1;

  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">
        Página <span className="font-medium">{page}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={prevPage}
          disabled={loading || params.skip === 0}
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={loading || !hasNextPage}
        >
          Próxima <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/* =========================
   Página
   ========================= */

function HighlightPage() {
  const { loading } = useHighlightContext();
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="sr-only">Eventos em Destaque</CardTitle>
        <Toolbar />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : null}
        <EventsTable />
      </CardContent>
      <CardFooter>
        <Pagination />
      </CardFooter>
    </Card>
  );
}

export function HighlightEventLayout() {
  return (
    <HighlightProvider>
      <HighlightPage />
    </HighlightProvider>
  );
}
