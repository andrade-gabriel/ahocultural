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
import { listAd, updateAdActivity, type AdListItem } from "@/api/ad";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
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
import {
  Loader2,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Plus,
} from "lucide-react";

/* =========================
   Helpers
   ========================= */

type Params = { skip: number; take: number; search?: string };

type AdContextShape = {
  items: AdListItem[];
  loading: boolean;
  error?: string;
  params: Params;
  search: string;
  hasNextPage: boolean;
  mutating: Set<number>;
  toggleActivity: (id: number, next?: boolean) => Promise<void>;
  setSearch: (v: string) => void;
  setPageSize: (take: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  refresh: () => void;
};

const AdContext = createContext<AdContextShape | null>(null);

function useAdsContext() {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error("useAdsContext deve ser usado dentro de <AdProvider />");
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
    any?.name === "CanceledError" ||
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}

function formatAdType(type: number): string {
  switch (type) {
    case 1:
      return "Menu";
    case 2:
      return "Categoria";
    default:
      return `Tipo ${type}`;
  }
}

/* =========================
   Provider
   ========================= */

function AdProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<AdListItem[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounced(searchInput, 400);
  const [mutating, setMutating] = useState<Set<number>>(new Set());

  const [params, setParams] = useState<Params>({
    skip: 0,
    take: 10,
    search: undefined,
  });
  const [hasNextPage, setHasNextPage] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const newSearch = debouncedSearch.trim() || undefined;
    setParams((p) =>
      p.search === newSearch ? p : { ...p, search: newSearch, skip: 0 }
    );
  }, [debouncedSearch]);

  const toggleActivity = useCallback(
    async (id: number, nextFromCaller?: boolean) => {
      if (mutating.has(id)) return;

      const current = items.find((a) => a.id === id)?.active;
      if (typeof current !== "boolean") return;

      const next = nextFromCaller ?? !current;

      setMutating((s) => new Set(s).add(id));
      setItems((prev) =>
        prev.map((a) => (a.id === id ? { ...a, active: next } : a))
      );

      try {
        await updateAdActivity(id, next);
      } catch (e) {
        setItems((prev) =>
          prev.map((a) => (a.id === id ? { ...a, active: current } : a))
        );
        const msg =
          e instanceof Error
            ? e.message
            : "Não foi possível atualizar o anúncio.";
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
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    const reqId = ++requestIdRef.current;

    setLoading(true);
    setError(undefined);

    try {
      const data = await listAd(
        { skip: params.skip, take: params.take, search: params.search },
        { signal: ac.signal }
      );

      if (reqId !== requestIdRef.current) return;
      setItems(data);
      setHasNextPage(data.length === params.take);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      if (isAbortError(e)) return;
      const msg =
        e instanceof Error
          ? e.message
          : "Não foi possível carregar os anúncios.";
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

  const value = useMemo<AdContextShape>(
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
      nextPage: () =>
        setParams((p) => ({ ...p, skip: p.skip + p.take })),
      prevPage: () =>
        setParams((p) => ({ ...p, skip: Math.max(0, p.skip - p.take) })),
      refresh: fetchData,
    }),
    [
      items,
      loading,
      error,
      params,
      hasNextPage,
      searchInput,
      fetchData,
      mutating,
      toggleActivity,
    ]
  );

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

/* =========================
   UI
   ========================= */

function Toolbar() {
  const { params, search, setSearch, setPageSize, refresh, loading } =
    useAdsContext();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold leading-none">Anúncios</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie os anúncios exibidos na plataforma
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por título…"
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
          <Link to="/ads/new">
            <Plus className="h-4 w-4" />
            Novo anúncio
          </Link>
        </Button>
      </div>
    </div>
  );
}

function AdsTable() {
  const { items, loading, error, mutating, toggleActivity } = useAdsContext();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [targetLabel, setTargetLabel] = useState<string>("");
  const [nextActive, setNextActive] = useState<boolean | null>(null);

  function askToggleConfirm(ad: AdListItem) {
    setTargetId(ad.id);
    setTargetLabel(ad.title);
    setNextActive(!ad.active);
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
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Nenhum anúncio encontrado.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead className="w-[160px]">Tipo</TableHead>
            <TableHead className="w-[220px]">Período</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => {
            const isSaving = mutating.has(a.id);
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);

            return (
              <TableRow key={a.id}>
                <TableCell className="font-medium underline">
                  <Link to={`/ads/${a.id}`}>{a.title}</Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatAdType(a.type)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {`${start.toLocaleDateString("pt-BR")} — ${end.toLocaleDateString("pt-BR")}`}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={a.active}
                    onCheckedChange={() => askToggleConfirm(a)}
                    disabled={isSaving || loading}
                    aria-label={`Ativar/desativar ${a.title}`}
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
              {nextActive ? "Ativar anúncio?" : "Desativar anúncio?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextActive
                ? `Confirma ativar "${targetLabel}"? Ele ficará visível na plataforma.`
                : `Confirma desativar "${targetLabel}"? Usuários podem deixar de ver este anúncio.`}
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
  const { params, hasNextPage, nextPage, prevPage, loading } = useAdsContext();
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

function AdPage() {
  const { loading } = useAdsContext();
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="sr-only">Anúncios</CardTitle>
        <CardDescription className="sr-only">Lista de anúncios</CardDescription>
        <Toolbar />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : null}
        <AdsTable />
      </CardContent>
      <CardFooter>
        <Pagination />
      </CardFooter>
    </Card>
  );
}

export function AdLayout() {
  return (
    <AdProvider>
      <AdPage />
    </AdProvider>
  );
}