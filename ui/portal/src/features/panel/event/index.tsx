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

/* ----------------------------- helpers de data ----------------------------- */
function toDate(v?: string | Date | null) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
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

const baseAppURL =
  import.meta.env.VITE_APP_BASE_URL?.replace(/\/+$/, "") || "";

/* -------------------------------- componente ------------------------------- */
export const EventLayout = () => {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();

  const {
    location: locationParam,
    district: districtParam,
    category: categorySlugParam,
    subcategory: subcategorySlugParam,
  } = useParams<{
    location?: string;
    district?: string;
    category?: string;
    subcategory?: string;
  }>();

  const qs = new URLSearchParams(search);
  const searchTerm = qs.get("q") ?? undefined;
  const fromQuery = qs.get("from") ?? undefined;

  // Detecta período pela URL
  const period: "hoje" | "esta-semana" | "este-fds" | "aho-aconselha" | null = useMemo(() => {
    if (pathname.includes("/hoje")) return "hoje";
    if (pathname.includes("/esta-semana")) return "esta-semana";
    if (pathname.includes("/fim-de-semana")) return "este-fds";
    if (pathname.includes("/aho-aconselha")) return "aho-aconselha";
    return null;
  }, [pathname]);

  // Data selecionada (prioriza ?from=YYYY-MM-DD; senão período/hoje)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const fromOk = fromQuery && !Number.isNaN(new Date(fromQuery).getTime());
    if (fromOk) return fromQuery!;
    if (period === "esta-semana") return toYmd(startOfWeek(new Date(), 1));
    if (period === "este-fds") return toYmd(fridayOfWeek(new Date()));
    return toYmd(new Date());
  });

  // Reajusta selectedDate se o período da rota mudar (a menos que tenha ?from)
  useEffect(() => {
    if (fromQuery) return; // querystring manda
    if (!period) return;
    if (period === "hoje") setSelectedDate(toYmd(new Date()));
    else if (period === "esta-semana") setSelectedDate(toYmd(startOfWeek(new Date(), 1)));
    else if (period === "este-fds") setSelectedDate(toYmd(fridayOfWeek(new Date())));
    // aho-aconselha => mantém data atual
  }, [period, fromQuery]);

  // Categoria (pai) e Subcategoria (filha) ativas
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
  const [resolvingSlug, setResolvingSlug] = useState<boolean>(!!(categorySlugParam || subcategorySlugParam));
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

  /* --------- Resolve :category e :subcategory sem resets agressivos --------- */
  useEffect(() => {
    const catSlug = (categorySlugParam || "").trim().toLowerCase();
    const childSlug = (subcategorySlugParam || "").trim().toLowerCase();

    // se não tem slug nenhum -> não mexe no que já está selecionado
    if (!catSlug && !childSlug) {
      setResolvingSlug(false);
      return;
    }
    if (catsLoading) {
      setResolvingSlug(true);
      return;
    }

    setResolvingSlug(true);

    // aplica estado somente se mudou
    const safeSet = (nextCat: string | null, nextChild: string | null) => {
      setActiveCat((prevCat) => (prevCat === nextCat ? prevCat : nextCat));
      setActiveChildCat((prevChild) => (prevChild === nextChild ? prevChild : nextChild));
    };

    // 1) tenta casar o PAI
    const parentMatch = catSlug
      ? cats.find((c) => c.slug?.toLowerCase() === catSlug)
      : undefined;

    if (parentMatch) {
      // garante/usa bucket do pai e tenta casar filha
      const cached = childrenByParent[parentMatch.id];
      const loadChildrenAndFinish = async () => {
        let kids = cached?.items;
        if (!kids) {
          const res = await listCategoryChildren(parentMatch.id, { skip: 0, take: 1000 });
          kids = (res || []).filter((c) => c.active);
          setChildrenByParent((prev) => ({
            ...prev,
            [parentMatch.id]: { items: kids!, loading: false },
          }));
        }
        const hit = childSlug ? kids.find((c) => c.slug?.toLowerCase() === childSlug) : null;
        safeSet(parentMatch.id, hit ? hit.id : null);
        setResolvingSlug(false);
      };

      if (!cached) {
        setChildrenByParent((prev) => ({
          ...prev,
          [parentMatch.id]: { items: [], loading: true },
        }));
      }
      loadChildrenAndFinish().catch(() => setResolvingSlug(false));
      return;
    }

    // 2) sem pai explícito, procura a filha entre todos os pais
    (async () => {
      try {
        const results = await Promise.all(
          cats.map(async (p) => {
            const cached = childrenByParent[p.id]?.items;
            if (cached) return { parent: p, children: cached };
            const res = await listCategoryChildren(p.id, { skip: 0, take: 1000 });
            const kids = (res || []).filter((c) => c.active);
            return { parent: p, children: kids };
          })
        );

        // salva cache
        setChildrenByParent((prev) => {
          const next = { ...prev };
          for (const { parent, children } of results) {
            next[parent.id] = { items: children, loading: false };
          }
          return next;
        });

        if (childSlug) {
          const hit = results
            .flatMap(r => r.children.map(c => ({ parent: r.parent, child: c })))
            .find(x => x.child.slug?.toLowerCase() === childSlug);

          if (hit) {
            safeSet(hit.parent.id, hit.child.id);
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
  }, [categorySlugParam, subcategorySlugParam, catsLoading, cats]);

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
        const params = {
          fromDate: startOfDayISO(selectedDate),
          categoryId: activeCat,              // id (pai) opcional
          subCategoryId: activeChildCat,      // id (filha) opcional
          location: locationParam ?? null,    // slug da cidade
          district: districtParam ?? null,    // slug do bairro
          skip: 0,
          take: 24,
          search: searchTerm ?? undefined,    // ?q=
        };

        const data = await listEvent(params, { signal: ac.signal });
        if (!ac.signal.aborted) setItems(data);
      } catch (e) {
        if (!ac.signal.aborted) setErr(e instanceof Error ? e.message : "Falha ao carregar eventos.");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [booting, selectedDate, activeCat, activeChildCat, searchTerm, pathname, locationParam, districtParam]);

  /* -------------------------------- navegação -------------------------------- */

  // mantém district (se houver) e também preserva ?q e ?from
  const withDistrictAndQuery = (suffix: string) => {
    const qs2 = new URLSearchParams(search);
    const qStr = qs2.toString();
    const base = districtParam
      ? `/${locationParam}/${districtParam}${suffix}`
      : `/${locationParam}${suffix}`;
    return qStr ? `${base}?${qStr}` : base;
  };

  // Pai: toggle; ao desmarcar volta para /eventos
  const onSelectParent = (id: string) => {
    const same = activeCat === id;

    if (same) {
      setActiveChildCat(null);
      setActiveCat(null);
      navigate(withDistrictAndQuery(`/eventos`), { replace: false });
      return;
    }

    const cat = cats.find((c) => c.id === id);
    setActiveChildCat(null);
    setActiveCat(id);

    // garante bucket carregado
    if (!childrenByParent[id]) {
      setChildrenByParent((prev) => ({ ...prev, [id]: { items: [], loading: true } }));
      listCategoryChildren(id, { skip: 0, take: 1000 })
        .then((res) => {
          setChildrenByParent((prev) => ({
            ...prev,
            [id]: { items: (res || []).filter((c) => c.active), loading: false },
          }));
        })
        .catch(() => {
          setChildrenByParent((prev) => ({
            ...prev,
            [id]: { items: [], loading: false },
          }));
        });
    }

    if (cat?.slug) {
      navigate(withDistrictAndQuery(`/eventos/${cat.slug}`), { replace: false });
    }
  };

  // Filha: toggle; ao desmarcar volta para PAI (ou /eventos)
  const onSelectSingleChild = (id: string) => {
    const same = activeChildCat === id;

    if (same) {
      setActiveChildCat(null);
      const parent = cats.find((c) => c.id === activeCat);
      if (parent?.slug) navigate(withDistrictAndQuery(`/eventos/${parent.slug}`), { replace: false });
      else navigate(withDistrictAndQuery(`/eventos`), { replace: false });
      return;
    }

    setActiveChildCat(id);
    const bucket = activeCat ? childrenByParent[activeCat] : undefined;
    const child = bucket?.items.find((c) => c.id === id);
    if (child?.slug) navigate(withDistrictAndQuery(`/eventos/${child.slug}`), { replace: false });
  };

  /* --------------------------------- RENDER ---------------------------------- */

  if (catsLoading || resolvingSlug) {
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

          {/* Linha 2: Subcategorias do pai selecionado (apenas 1 ativa) */}
          {activeCat && (() => {
            const parent = cats.find((c) => c.id === activeCat);
            const bucket = childrenByParent[activeCat];
            const loadingKids = !bucket || bucket.loading;
            const kids = bucket?.items ?? [];

            return (
              <div className="border-l pl-4">
                <div className="text-xs uppercase text-muted-foreground mb-2">
                  {parent?.name ?? "Subcategorias"}
                </div>

                {loadingKids ? (
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-28 rounded-full" />
                    <Skeleton className="h-8 w-32 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                  </div>
                ) : kids.length === 0 ? (
                  <div className="text-xs text-muted-foreground">Sem subcategorias.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {kids.map((child) => {
                      const active = activeChildCat === child.id;
                      return (
                        <Button
                          key={child.id}
                          variant={active ? "default" : "outline"}
                          className="h-8 rounded-full text-sm"
                          disabled={loadingKids}
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

              // Link do card preservando district (se houver)
              const cardHref = districtParam
                ? `/${locationParam}/${districtParam}/eventos/${ev.categorySlug}/${ev.slug}`
                : `/${locationParam}/eventos/${ev.categorySlug}/${ev.slug}`;

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

                  <Link to={cardHref} className="block group">
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
