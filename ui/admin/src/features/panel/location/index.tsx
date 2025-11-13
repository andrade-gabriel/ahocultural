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
import { listLocations, updateLocationActivity, type Location } from "@/api/location";

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
import { Loader2, RefreshCcw, ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";

/* =========================
   Contexto
   ========================= */

type Params = { skip: number; take: number; search?: string };

type LocationContextShape = {
    items: Location[];
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

const LocationContext = createContext<LocationContextShape | null>(null);

function useLocationsContext() {
    const ctx = useContext(LocationContext);
    if (!ctx) throw new Error("useLocationsContext deve ser usado dentro de <LocationProvider />");
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

function LocationProvider({ children }: PropsWithChildren) {
    const [items, setItems] = useState<Location[]>([]);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState(false);

    const [searchInput, setSearchInput] = useState("");
    const debouncedSearch = useDebounced(searchInput, 400);
    const [mutating, setMutating] = useState<Set<number>>(new Set());

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
        async (id: number, nextFromCaller?: boolean) => {
            if (mutating.has(id)) return;

            const current = items.find((l) => l.id === id)?.active;
            if (typeof current !== "boolean") return;

            const next = nextFromCaller ?? !current;

            // otimista
            setMutating((s) => new Set(s).add(id));
            setItems((prev) => prev.map((l) => (l.id === id ? { ...l, active: next } : l)));

            try {
                await updateLocationActivity(id, next);
                // mantém otimista
            } catch (e) {
                // reverte
                setItems((prev) => prev.map((l) => (l.id === id ? { ...l, active: current } : l)));
                const msg = e instanceof Error ? e.message : "Não foi possível atualizar a localização.";
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
            const data = await listLocations(
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
            const msg = e instanceof Error ? e.message : "Não foi possível carregar as localizações.";
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

    const value = useMemo<LocationContextShape>(
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

    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

/* =========================
   UI
   ========================= */

function Toolbar() {
    const { params, search, setSearch, setPageSize, refresh, loading } = useLocationsContext();

    return (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                    <h2 className="text-base font-semibold leading-none">Locais</h2>
                    <p className="text-sm text-muted-foreground">Gerencie as localizações ativas na plataforma</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Input
                    placeholder="Buscar por cidade, estado ou país…"
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
                    <Link to="/location/new">
                        <Plus className="h-4 w-4" />
                        Novo local
                    </Link>
                </Button>
            </div>
        </div>
    );
}

function LocationsTable() {
    const { items, loading, error, mutating, toggleActivity } = useLocationsContext();

    // estado do modal
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [targetId, setTargetId] = useState<number | null>(null);
    const [targetLabel, setTargetLabel] = useState<string>("");
    const [nextActive, setNextActive] = useState<boolean | null>(null);

    function labelOf(l: Location) {
        const city = l.city || "?";
        const state = l.state || "?";
        const country = l.country || "?";
        return `${city} • ${state} • ${country}`;
    }

    function askToggleConfirm(location: Location) {
        setTargetId(location.id);
        setTargetLabel(labelOf(location));
        setNextActive(!location.active);
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
                        <Skeleton className="h-5 w-20" />
                    </div>
                ))}
            </div>
        );
    }

    if (!loading && items.length === 0) {
        return (
            <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma localização encontrado.
            </div>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Local</TableHead>
                        <TableHead className="w-[140px]">Cidade</TableHead>
                        <TableHead className="w-[100px]">UF/Estado</TableHead>
                        <TableHead className="w-[160px]">País</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((l) => {
                        const isSaving = mutating.has(l.id);
                        return (
                            <TableRow key={l.id}>
                                <TableCell className="font-medium underline">
                                    <Link to={`/location/${l.id}`}>{labelOf(l)}</Link>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{l.city ?? "-"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{l.state ?? "-"}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{l.country ?? "-"}</TableCell>
                                <TableCell>
                                    <Switch
                                        checked={l.active}
                                        onCheckedChange={() => askToggleConfirm(l)}
                                        disabled={isSaving || loading}
                                        aria-label={`Ativar/desativar ${labelOf(l)}`}
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
                            {nextActive ? "Ativar localização?" : "Desativar localização?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {nextActive
                                ? `Confirma ativar "${targetLabel}"? Ela ficará visível e utilizável no painel.`
                                : `Confirma desativar "${targetLabel}"? Usuários podem perder acesso a recursos dessa localização.`}
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
    const { params, hasNextPage, nextPage, prevPage, loading } = useLocationsContext();
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

function LocationPage() {
    const { loading } = useLocationsContext();
    return (
        <Card className="shadow-sm">
            <CardHeader className="pb-4">
                <CardTitle className="sr-only">Locais</CardTitle>
                <CardDescription className="sr-only">Lista de localizações</CardDescription>
                <Toolbar />
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando…
                    </div>
                ) : null}
                <LocationsTable />
            </CardContent>
            <CardFooter>
                <Pagination />
            </CardFooter>
        </Card>
    );
}

export function LocationLayout() {
    return (
        <LocationProvider>
            <LocationPage />
        </LocationProvider>
    );
}
