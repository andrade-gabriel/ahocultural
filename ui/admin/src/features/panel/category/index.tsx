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
import {
  listCategories,
  updateCategoryActivity,
  type Category,
} from "@/api/category";

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
import { Loader2, RefreshCcw, ChevronLeft, ChevronRight, Tags, Plus } from "lucide-react";

/* =========================
   Contexto
   ========================= */

type Params = { skip: number; take: number; search?: string };

type CategoryContextShape = {
  items: Category[];
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

const CategoryContext = createContext<CategoryContextShape | null>(null);

function useCategoriesContext() {
  const ctx = useContext(CategoryContext);
  if (!ctx) throw new Error("useCategoriesContext deve ser usado dentro de <CategoryProvider />");
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

function CategoryProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<Category[]>([]);
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

      const current = items.find((c) => c.id === id)?.active;
      if (typeof current !== "boolean") return;

      const next = nextFromCaller ?? !current;

      // otimista
      setMutating((s) => new Set(s).add(id));
      setItems((prev) => prev.map((c) => (c.id === id ? { ...c, active: next } : c)));

      try {
        await updateCategoryActivity(id, next);
        // mantém otimista
      } catch (e) {
        // reverte
        setItems((prev) => prev.map((c) => (c.id === id ? { ...c, active: current } : c)));
        const msg = e instanceof Error ? e.message : "Não foi possível atualizar a categoria.";
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
      const data = await listCategories(
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
      const msg = e instanceof Error ? e.message : "Não foi possível carregar as categorias.";
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

  const value = useMemo<CategoryContextShape>(
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

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

/* =========================
   UI
   ========================= */

function Toolbar() {
  const { params, search, setSearch, setPageSize, refresh, loading } = useCategoriesContext();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-2">
        <Tags className="h-5 w-5 text-muted-foreground" />
        <div>
          <h2 className="text-base font-semibold leading-none">Categorias</h2>
          <p className="text-sm text-muted-foreground">Gerencie as categorias ativas na plataforma</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Buscar por nome…"
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
          <Link to="/category/new">
            <Plus className="h-4 w-4" />
            Nova categoria
          </Link>
        </Button>
      </div>
    </div>
  );
}

function CategoriesTable() {
  const { items, loading, error, mutating, toggleActivity } = useCategoriesContext();

  // estado do modal
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string>("");
  const [nextActive, setNextActive] = useState<boolean | null>(null);

  function askToggleConfirm(category: Category) {
    setTargetId(category.id);
    setTargetName(category.name);
    setNextActive(!category.active);
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
            <Skeleton className="h-5 w-8" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Nenhuma categoria encontrada.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead className="w-[200px]">Categoria Pai</TableHead>
            <TableHead className="w-[200px]">Slug</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((c) => {
            const isSaving = mutating.has(c.id);
            return (
              <TableRow key={c.id}>
                <TableCell className="font-medium underline">
                  <Link to={`/category/${c.id}`}>{c.name}</Link>
                </TableCell>
                <TableCell>
                  <div className="leading-tight">
                    <div className="text-sm  underline">
                      <Link to={`/category/${c.parent_id}`}>{c.parent_name}</Link>
                    </div>
                    {/* {c.parent_slug ? (
                      <div className="font-mono text-xs text-muted-foreground">{c.parent_slug}</div>
                    ) : null} */}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                <TableCell>
                  <Switch
                    checked={c.active}
                    onCheckedChange={() => askToggleConfirm(c)}
                    disabled={isSaving || loading}
                    aria-label={`Ativar/desativar ${c.name}`}
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
              {nextActive ? "Ativar categoria?" : "Desativar categoria?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {nextActive
                ? `Confirma ativar "${targetName}"? Ela ficará visível e utilizável no painel.`
                : `Confirma desativar "${targetName}"? Usuários podem perder acesso a recursos desta categoria.`}
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
  const { params, hasNextPage, nextPage, prevPage, loading } = useCategoriesContext();
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

function CategoryPage() {
  const { loading } = useCategoriesContext();
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="sr-only">Categorias</CardTitle>
        <CardDescription className="sr-only">Lista de categorias</CardDescription>
        <Toolbar />
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : null}
        <CategoriesTable />
      </CardContent>
      <CardFooter>
        <Pagination />
      </CardFooter>
    </Card>
  );
}

export function CategoryLayout() {
  return (
    <CategoryProvider>
      <CategoryPage />
    </CategoryProvider>
  );
}
