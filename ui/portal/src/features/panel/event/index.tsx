import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  listCategories,
  listCategoryChildren,
  type Category,
} from "@/api/category";
import { listEvent, type Event } from "@/api/event";

const baseAppURL =
  import.meta.env.VITE_APP_BASE_URL?.replace(/\/+$/, "") || "";

/* ----------------------------- helpers de data ----------------------------- */
function toDate(v?: string | Date | null) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function startOfDayISO(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((x) => parseInt(x, 10));
  const local = new Date(y, (m ?? 1) - 1, d ?? 1, 0, 0, 0, 0);
  return local.toISOString();
}
function fmtWeekday(d: Date, tz = "America/Sao_Paulo") {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long" })
    .format(d)
    .toUpperCase();
}
function fmtDay(d: Date, tz = "America/Sao_Paulo") {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit" }).format(d);
}
function fmtMonth(d: Date, tz = "America/Sao_Paulo") {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, month: "long" })
    .format(d)
    .toUpperCase();
}

/* --------- helpers de período (hoje / esta-semana / este-fds) --------- */
function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function startOfWeek(date = new Date(), weekStartsOn = 1 /* seg */) {
  const d = new Date(date);
  const day = d.getDay(); // 0..6 (dom=0)
  const diff = (day - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function fridayOfWeek(date = new Date()) {
  const monday = startOfWeek(date, 1);
  const fri = new Date(monday);
  fri.setDate(monday.getDate() + 4); // seg + 4 = sexta
  return fri;
}

/* -------------------------------- componente ------------------------------- */
export const EventLayout = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { location, category: categorySlugParam } = useParams<{
    location?: string;
    category?: string;
  }>();

  // base para navegação
  const basePath = `/${(location ?? "").replace(/^\/+|\/+$/g, "")}/eventos`;

  // Detecta período pela URL
  const period: "hoje" | "esta-semana" | "este-fds" | "aho-aconselha" | null = useMemo(() => {
    if (pathname.includes("/hoje")) return "hoje";
    if (pathname.includes("/esta-semana")) return "esta-semana";
    if (pathname.includes("/fim-de-semana")) return "este-fds";
    if (pathname.includes("/aho-aconselha")) return "aho-aconselha";
    return null;
  }, [pathname]);

  // Filtro de data
  const [selectedDate, setSelectedDate] = useState<string>(() => toYmd(new Date()));

  // Ajusta a data quando muda o período na rota
  useEffect(() => {
    if (!period) return;
    if (period === "hoje") {
      setSelectedDate(toYmd(new Date()));
    } else if (period === "esta-semana") {
      setSelectedDate(toYmd(startOfWeek(new Date(), 1)));
    } else if (period === "este-fds") {
      setSelectedDate(toYmd(fridayOfWeek(new Date())));
    } else if (period === "aho-aconselha") {
      // por enquanto não tem regra; mantém a data atual
    }
  }, [period]);

  // Pai (1) e Subcategoria (1)
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [activeChildCat, setActiveChildCat] = useState<string | null>(null);

  // Pais
  const [cats, setCats] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsErr, setCatsErr] = useState<string>();
  const catsAC = useRef<AbortController | null>(null);

  // Cache de children por parentId
  type ChildrenBucket = { items: Category[]; loading: boolean; error?: string };
  const [childrenByParent, setChildrenByParent] = useState<Record<string, ChildrenBucket>>({});

  // Eventos
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>();
  const itemsAC = useRef<AbortController | null>(null);

  // Controle de boot sem flicker
  const [resolvingSlug, setResolvingSlug] = useState<boolean>(!!categorySlugParam);
  const booting = catsLoading || resolvingSlug;

  /* -------------------------- Carrega categorias “pai” -------------------------- */
  useEffect(() => {
    setCatsLoading(true);
    setCatsErr(undefined);
    catsAC.current?.abort();
    const ac = new AbortController();
    catsAC.current = ac;

    (async () => {
      try {
        const list = await listCategories({ skip: 0, take: 1000 }, { signal: ac.signal });
        setCats(list.filter((c) => c.active && !c.parent_id));
      } catch (e) {
        if (!ac.signal.aborted) {
          setCatsErr(e instanceof Error ? e.message : "Falha ao carregar categorias.");
        }
      } finally {
        if (!ac.signal.aborted) setCatsLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  /* --------- Resolve :category (pai/filha) e só então libera a tela --------- */
  useEffect(() => {
    const slug = (categorySlugParam || "").trim().toLowerCase();

    // Sem slug -> nada para resolver
    if (!slug) {
      setActiveCat(null);
      setActiveChildCat(null);
      setResolvingSlug(false);
      return;
    }
    if (catsLoading) {
      setResolvingSlug(true);
      return;
    }

    setResolvingSlug(true);
    setActiveCat(null);
    setActiveChildCat(null);

    // 1) tenta achar entre pais
    const parentMatch = cats.find((c) => c.slug?.toLowerCase() === slug);
    if (parentMatch) {
      setActiveCat(parentMatch.id);

      // carrega filhas do pai antes de liberar
      const cached = childrenByParent[parentMatch.id];
      if (cached && !cached.loading) {
        setResolvingSlug(false);
        return;
      }
      setChildrenByParent((prev) => ({
        ...prev,
        [parentMatch.id]: { items: [], loading: true },
      }));
      listCategoryChildren(parentMatch.id, { skip: 0, take: 1000 })
        .then((children) => {
          setChildrenByParent((prev) => ({
            ...prev,
            [parentMatch.id]: { items: (children || []).filter((c) => c.active), loading: false },
          }));
        })
        .finally(() => setResolvingSlug(false));
      return;
    }

    // 2) procura entre filhas (paralelo)
    (async () => {
      try {
        const jobs = cats.map(async (p) => {
          const cached = childrenByParent[p.id]?.items;
          if (Array.isArray(cached) && cached.length > 0) {
            return { parent: p, children: cached };
          }
          const children = await listCategoryChildren(p.id, { skip: 0, take: 1000 });
          return { parent: p, children: (children || []).filter((c) => c.active) };
        });

        const results = await Promise.all(jobs);

        setChildrenByParent((prev) => {
          const next = { ...prev };
          for (const { parent, children } of results) {
            next[parent.id] = { items: children, loading: false };
          }
          return next;
        });

        for (const { parent, children } of results) {
          const hit = children.find((c) => c.slug?.toLowerCase() === slug);
          if (hit) {
            setActiveCat(parent.id);
            setActiveChildCat(hit.id);
            setResolvingSlug(false);
            return;
          }
        }

        setResolvingSlug(false);
      } catch {
        setResolvingSlug(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlugParam, catsLoading, cats]);

  /* -------------------- Buscar eventos (listEvent) quando pronto ------------------- */
  useEffect(() => {
    if (booting) return;

    setLoading(true);
    setErr(undefined);
    itemsAC.current?.abort();
    const ac = new AbortController();
    itemsAC.current = ac;

    (async () => {
      try {
        const categoryId = activeChildCat ?? activeCat ?? null;
        const fromDate = startOfDayISO(selectedDate);

        const data = await listEvent(
          { skip: 0, take: 24, fromDate, categoryId },
          { signal: ac.signal }
        );

        if (!ac.signal.aborted) setItems(data);
      } catch (e) {
        if (!ac.signal.aborted) setErr(e instanceof Error ? e.message : "Falha ao carregar eventos.");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [booting, selectedDate, activeCat, activeChildCat]);

  /* --------------------------------- navegação por slug --------------------------------- */
  // Clicar no pai: navega para /eventos/:slug (ou volta para período/base se desmarcar)
  const onSelectParent = (id: string) => {
    const same = activeCat === id;
    setActiveChildCat(null);

    if (same) {
      setActiveCat(null);
      // se existe período, volta para a rota do período; senão volta para base
      navigate(period ? `${basePath}/${period}` : `${basePath}`, { replace: false });
      return;
    }

    const cat = cats.find((c) => c.id === id);
    setActiveCat(id);
    if (cat?.slug) {
      navigate(`${basePath}/${cat.slug}`, { replace: false });
    }
    // carrega filhas se necessário
    if (!childrenByParent[id]) {
      setChildrenByParent((prev) => ({ ...prev, [id]: { items: [], loading: true } }));
      listCategoryChildren(id, { skip: 0, take: 1000 })
        .then((res) => {
          setChildrenByParent((prev) => ({
            ...prev,
            [id]: { items: (res || []).filter((c) => c.active), loading: false },
          }));
        })
        .catch((e) => {
          setChildrenByParent((prev) => ({
            ...prev,
            [id]: {
              items: [],
              loading: false,
              error: e instanceof Error ? e.message : "Falha ao carregar subcategorias.",
            },
          }));
        });
    }
  };

  // Clicar na filha: navega sempre para /eventos/:slug-da-filha; desmarcar volta para slug do pai (se houver) ou período/base
  const onSelectSingleChild = (id: string) => {
    const same = activeChildCat === id;
    if (same) {
      setActiveChildCat(null);
      const parent = cats.find((c) => c.id === activeCat || c.id === activeCat);
      const parentSlug = parent?.slug;
      if (parentSlug) {
        navigate(`${basePath}/${parentSlug}`, { replace: false });
      } else {
        navigate(period ? `${basePath}/${period}` : `${basePath}`, { replace: false });
      }
      return;
    }

    setActiveChildCat(id);
    const bucket = activeCat ? childrenByParent[activeCat] : undefined;
    const child = bucket?.items.find((c) => c.id === id);
    if (child?.slug) {
      navigate(`${basePath}/${child.slug}`, { replace: false });
    }
  };

  /* -------------------------------- UI helpers ------------------------------- */
  const selectedDateLabel = useMemo(() => {
    const d = toDate(selectedDate);
    if (!d) return "";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);
  }, [selectedDate]);

  /* ------------------------------- RENDER ----------------------------------- */

  if (booting) {
    return (
      <div className="w-full">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
          <Skeleton className="h-10 w-2/3 mx-auto mb-10" />
          <div className="mb-8 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-[200px] rounded-md" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-9 w-36 rounded-full" />
                <Skeleton className="h-9 w-32 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </div>
            <div className="border-l pl-4">
              <Skeleton className="h-4 w-28 mb-2" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-32 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-l pl-4">
                <div className="flex items-baseline gap-3 mb-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-8" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border bg-muted/20">
                  <Skeleton className="absolute inset-0" />
                  <div className="absolute top-2 left-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <h1 className="text-5xl font-semibold tracking-wide text-center mb-10">
          CALENDÁRIO DE EVENTOS
        </h1>

        {/* ------- Filtros ------- */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Data */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Data:</span>
              <div className="relative">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="pl-9 h-9 w-[200px] cursor-pointer"
                />
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Categorias pai (apenas 1 ativa) */}
            <div className="flex flex-wrap gap-2">
              {catsErr ? (
                <Alert className="py-2">
                  <AlertTitle className="text-sm">Categorias</AlertTitle>
                  <AlertDescription className="text-xs">{catsErr}</AlertDescription>
                </Alert>
              ) : (
                cats.map((c) => {
                  const active = activeCat === c.id;
                  return (
                    <Button
                      key={c.id}
                      variant={active ? "default" : "outline"}
                      className="h-9 rounded-full"
                      onClick={() => onSelectParent(c.id)}
                    >
                      {c.name}
                    </Button>
                  );
                })
              )}
            </div>
          </div>

          {/* Linha 2: Children do pai selecionado (apenas 1 ativa) */}
          {activeCat && (
            <div className="flex flex-col gap-3">
              {(() => {
                const parent = cats.find((c) => c.id === activeCat);
                const bucket = childrenByParent[activeCat];

                return (
                  <div className="border-l pl-4">
                    <div className="text-xs uppercase text-muted-foreground mb-2">
                      {parent?.name ?? "Subcategorias"}
                    </div>

                    {!bucket || bucket.loading ? (
                      <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-8 w-28 rounded-full" />
                        <Skeleton className="h-8 w-32 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                      </div>
                    ) : bucket.error ? (
                      <Alert className="py-2">
                        <AlertTitle className="text-sm">Subcategorias</AlertTitle>
                        <AlertDescription className="text-xs">{bucket.error}</AlertDescription>
                      </Alert>
                    ) : bucket.items.length === 0 ? (
                      <div className="text-xs text-muted-foreground">Sem subcategorias.</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {bucket.items.map((child) => {
                          const active = activeChildCat === child.id; // SINGLE
                          return (
                            <Button
                              key={child.id}
                              variant={active ? "default" : "outline"}
                              className="h-8 rounded-full text-sm"
                              onClick={() => onSelectSingleChild(child.id)}
                            >
                              {child.name}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ------- Grid de eventos ------- */}
        {err && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{err}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border-l pl-4">
                <div className="flex items-baseline gap-3 mb-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-7 w-8" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border bg-muted/20">
                  <Skeleton className="absolute inset-0" />
                  <div className="absolute top-2 left-2">
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
                <Skeleton className="mt-2 h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((ev) => {
              const d = toDate(ev.startDate);
              const thumb = ev.thumbnail ? `${baseAppURL}/assets/${ev.thumbnail}` : undefined;
              const highlight = ev.sponsored ? "bg-gradient-to-br from-yellow-50 to-white" : "";

              return (
                <article key={ev.id} className={`border-l pl-4 rounded-md ${highlight}`}>
                  {d && (
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {fmtWeekday(d)}
                      </span>
                      <span className="text-3xl font-semibold leading-none">
                        {fmtDay(d)}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {fmtMonth(d)}
                      </span>
                    </div>
                  )}

                  <Link to={`/${location ?? ""}/eventos/${ev.categorySlug}/${ev.slug}`} className="block group">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border bg-muted/20">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={ev.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full" />
                      )}

                      {ev.sponsored && (
                        <div className="absolute top-2 left-2">
                          <span className="inline-flex items-center rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Patrocinado
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="mt-2 text-base font-medium leading-snug line-clamp-2">
                      {ev.title}
                    </h3>
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
