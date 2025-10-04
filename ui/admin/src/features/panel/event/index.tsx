import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { Link } from "react-router";
import type { PropsWithChildren } from "react";
import { listEvent, updateEventActivity, type Event } from "@/api/event";

import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RefreshCcw, ChevronLeft, ChevronRight, CalendarDays, Plus, BadgeDollarSign } from "lucide-react";

/* =========================
   Contexto
   ========================= */

type Params = { skip: number; take: number; search?: string };

type EventContextShape = {
  items: Event[];
  loading: boolean;
  error?: string;
  params: Params;
  search: string;
  hasNextPage: boolean;
  mutating: Set<string>;
  toggleActivity: (id: string, next?: boolean) => Promise<void>;
  setSearch: (v: string) => void;
  setPageSize: (take: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => void;
};

const EventContext = createContext<EventContextShape | null>(null);

function useEventsContext() {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEventsContext deve ser usado dentro de <EventProvider />");
  return ctx;
}

/* Debounce simples */
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* Detectar cancelamento (axios + AbortController) */
function isAbortError(e: unknown) {
  const any = e as any;
  return (
    any?.name === "CanceledError" || // axios
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}

function EventProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<Event[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounced(searchInput, 400);
  const [mutating, setMutating] = useState<Set<string>>(new Set());

  // comece com search undefined para não mudar params no mount
  const [params, setParams] = useState<Params>({ skip: 0, take: 10, search: undefined });
  const [hasNextPage, setHasNextPage] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Atualiza search com debounce somente se mudou
  useEffect(() => {
    const newSearch = debouncedSearch.trim() || undefined;
    setParams((p) => (p.search === newSearch ? p : { ...p, search: newSearch, skip: 0 }));
  }, [debouncedSearch]);

  const toggleActivity = useCallback(
    async (id: string, nextFromCaller?: boolean) => {
      if (mutating.has(id)) return;

      const current = items.find((e) => e.id === id)?.active;
      if (typeof current !== "boolean") return;

      const next = nextFromCaller ?? !current;

      // otimista
      setMutating((s) => new Set(s).add(id));
      setItems((prev) => prev.map((e) => (e.id === id ? { ...e, active: next } : e)));

      try {
        await updateEventActivity(id, next);
        // mantém otimista
      } catch (e) {
        // reverte
        setItems((prev) => prev.map((ev) => (ev.id === id ? { ...ev, active: current } : ev)));
        const msg = e instanceof Error ? e.message : "Não foi possível atualizar o evento.";
        setError(msg);
      } finally {
        setMutating((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        });
      }
    },
    [items, mutating]
  );

  const fetchData = useCallback(async () => {
    // cancela a anterior
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const reqId = ++requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const data = await listEvent(
        { skip: params.skip, take: params.take, search: params.search },
        { signal: ac.signal }
      );

      if (reqId !== requestIdRef.current) return; // resposta velha
      setItems(data);
      setHasNextPage(data.length === params.take);
      setError(undefined); // garante limpar mensagem antiga
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      if (isAbortError(e)) {
        // ignorar cancelamentos
        return;
      }
      const msg = e instanceof Error ? e.message : "Não foi possível carregar os eventos.";
      setError(msg);
      setItems([]);
      setHasNextPage(false);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, [params.skip, params.take, params.search]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  const value = useMemo<EventContextShape>(
    () => ({
      items,
      loading,
      error,
      params,
      search: searchInput,
      mutating,
      toggleActivity,
      hasNextPage,
      setSearch: (v: string) => setSearchInput(v),
      setPageSize: (take: number) =>
        setParams((p) => ({ ...p, take: Math.max(1, take), skip: 0 })),
      nextPage: () => setParams((p) => ({ ...p, skip: p.skip + p.take })),
      prevPage: () => setParams((p) => ({ ...p, skip: Math.max(0, p.skip - p.take) })),
      refresh: fetchData,
    }),
    [items, loading, error, params, hasNextPage, searchInput, fetchData, mutating, toggleActivity]
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

/* =========================
   UI
   ========================= */

function Toolbar() {
  const { params, search, setSearch, setPageSize, refresh, loading } = useEventsContext();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold leading-none">Eventos</h2>
          <p className="text-sm text-muted-foreground">Gerencie os eventos da plataforma</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por título, categoria ou local…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        <select
          className="h-9 rounded-md border bg-background px-2 text-sm"
          value={params.take}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}/página
            </option>
          ))}
        </select>
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
        <Button asChild className="gap-2">
          <Link to="/event/new">
            <Plus className="h-4 w-4" />
            Novo evento
          </Link>
        </Button>
      </div>
    </div>
  );
}

function formatBRL(v: number | undefined) {
  if (typeof v !== "number" || Number.isNaN(v)) return "-";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 }).format(v);
}

function formatRange(start?: Date | string, end?: Date | string) {
  if (!start) return "-";
  const s = new Date(start);
  const e = end ? new Date(end) : undefined;
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" };
  const sStr = isNaN(s.getTime()) ? "-" : s.toLocaleDateString("pt-BR", opts);
  const eStr = e && !isNaN(e.getTime()) ? e.toLocaleDateString("pt-BR", opts) : "";
  return eStr ? `${sStr} — ${eStr}` : sStr;
}

function EventsTable() {
  const { items, loading, error, mutating, toggleActivity } = useEventsContext();

  // estado do modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetLabel, setTargetLabel] = useState<string>("");
  const [nextActive, setNextActive] = useState<boolean | null>(null);

  function askToggleConfirm(event: Event) {
    setTargetId(event.id);
    setTargetLabel(event.title);
    setNextActive(!event.active);
    setConfirmOpen(true);
  }

  async function confirmToggle() {
    if (!targetId || nextActive == null) {
      setConfirmOpen(false);
      return;
    }
    await toggleActivity(targetId, nextActive);
    setConfirmOpen(false);
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Falha ao carregar</AlertTitle>
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
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead className="w-[160px]">Categoria</TableHead>
            <TableHead className="w-[210px]">Período</TableHead>
            <TableHead className="w-[180px]">Local</TableHead>
            <TableHead className="w-[130px]">Preço</TableHead>
            <TableHead className="w-[110px]">Patrocinado</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((e) => {
            const isSaving = mutating.has(e.id);
            return (
              <TableRow key={e.id}>
                <TableCell className="font-medium underline">
                  <Link to={`/event/${e.id}`}>{e.title}</Link>
                  <div className="text-xs text-muted-foreground">{e.slug}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.category ?? "-"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatRange(e.startDate, e.endDate)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.location ?? "-"}</TableCell>
                <TableCell className="text-sm flex items-center gap-1">
                  <BadgeDollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatBRL(e.pricing)}</span>
                </TableCell>
                <TableCell className="text-sm">
                  {e.sponsored ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      Sim
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-border">
                      Não
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={e.active}
                    onCheckedChange={() => askToggleConfirm(e)}
                    disabled={isSaving || loading}
                    aria-label={`Ativar/desativar ${e.title}`}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {nextActive ? "Ativar evento?" : "Desativar evento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextActive
                ? `Confirma ativar "${targetLabel}"? Ele ficará visível na plataforma.`
                : `Confirma desativar "${targetLabel}"? Usuários podem perder acesso a este evento.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              {nextActive ? "Ativar" : "Desativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Pagination() {
  const { params, hasNextPage, nextPage, prevPage, loading } = useEventsContext();
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
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={nextPage}
          disabled={loading || !hasNextPage}
          className="gap-1"
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

function EventPage() {
  const { loading } = useEventsContext();
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="sr-only">Eventos</CardTitle>
        <CardDescription className="sr-only">Lista de eventos</CardDescription>
        <Toolbar />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
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

export function EventLayout() {
  return (
    <EventProvider>
      <EventPage />
    </EventProvider>
  );
}
