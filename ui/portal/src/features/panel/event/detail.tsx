import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEventBySlug,
  getRelatedEventsBySlug,
  type EventDetail,
} from "@/api/event";
import { MapPin, Accessibility, Bike, ParkingCircle, HelpCircle } from "lucide-react";

const baseAppURL =
  import.meta.env.VITE_APP_BASE_URL?.replace(/\/+$/, "") || "";

/* -------------------------------- helpers -------------------------------- */

function isAbortError(e: unknown) {
  const any = e as any;
  return (
    any?.name === "CanceledError" ||
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}

type DateInput = Date | string | number | null | undefined;
function toDate(v: DateInput): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtDDMMYY_HHMM(input: DateInput, tz = "America/Sao_Paulo") {
  const d = toDate(input);
  if (!d) return "";
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(d);
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date} às ${time}`;
}

/** Constrói o endereço amigável a partir de company.address */
function formatCompanyAddress(ev?: EventDetail | null): string {
  const a = ev?.company?.address;
  if (!a) return ev?.company?.name || "—";

  const streetNum = [a.street, a.number].filter(Boolean).join(", ");
  const cityUf = [a.city, a.state].filter(Boolean).join(" - ");

  const parts = [
    streetNum,
    a.complement,
    a.district,
    cityUf,
  ].filter(Boolean);

  return parts.join(" – ");
}

/** Link universal pra abrir em mapas (funciona iOS/Android/Web) */
function buildMapsLink(address: string) {
  const encoded = encodeURIComponent(address.trim());
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}

/** Data compacta para “Veja também” */
function formatRelatedDate(start?: DateInput, tz = "America/Sao_Paulo") {
  const s = toDate(start);
  if (!s) return "";

  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(s);

  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(s);

  return `A partir de ${date} às ${time}`;
}


/* ------------------------------ subcomponentes ------------------------------ */

const InfoCell = ({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`${className}`}>
    <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
      {title}
    </div>
    <div className="mt-2">{children}</div>
  </div>
);

export const RelatedItem = ({
  date,
  title,
  category,
  href,
  thumbnail,
}: {
  date: string;
  title: string;
  category: string;
  href?: string;
  thumbnail?: string;
}) => (
  <div className="flex items-start gap-4 border-l pl-4">
    {/* Imagem (thumbnail) */}
    {thumbnail && (
      <div className="flex-shrink-0 w-20 h-20 overflow-hidden rounded-md border border-border/50">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
          loading="lazy"
        />
      </div>
    )}

    {/* Texto */}
    <div className="flex flex-col justify-center">
      <div className="text-xs uppercase text-muted-foreground">{date}</div>

      {href ? (
        <Link
          to={href}
          className="mt-1 block text-lg font-medium leading-snug hover:underline underline-offset-4"
        >
          {title}
        </Link>
      ) : (
        <span className="mt-1 block text-lg font-medium leading-snug">
          {title}
        </span>
      )}

      <div className="mt-1 text-xs uppercase text-muted-foreground">
        {category}
      </div>
    </div>
  </div>
);

/* ------------------------------ skeletons ------------------------------ */

function BadgesSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
  );
}

function InfoCellsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 md:[&>*:not(:first-child)]:border-l mb-10">
      {/* ONDE (span 2) */}
      <div className="py-4 pr-6 md:pl-6 space-y-2 md:col-span-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-[85%]" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      {/* QUANDO */}
      <div className="py-4 pr-6 md:pl-6">
        <Skeleton className="h-3 w-16 mb-2" />
        <div className="flex items-center text-sm">
          <Skeleton className="h-4 w-28" />
          <span aria-hidden className="mx-3 h-5 w-px self-center bg-[hsl(var(--border))]" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* VALOR */}
      <div className="py-4 pr-6 md:pl-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-24" />
      </div>

      {/* CONTATO */}
      <div className="py-4 pr-6 md:pl-6 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-36" />
      </div>
    </div>
  );
}

function FacilitiesSkeleton() {
  return (
    <div className="mt-6 mb-4 flex flex-wrap gap-2">
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-6 w-32 rounded-full" />
      <Skeleton className="h-6 w-28 rounded-full" />
    </div>
  );
}

function RelatedItemSkeleton() {
  return (
    <div className="border-l pl-4">
      <Skeleton className="h-3 w-40 mb-2" />
      <Skeleton className="h-3 w-64 mb-2" />
      <Skeleton className="h-4 w-72 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */

export const EventDetailLayout = () => {
  const { id } = useParams();

  const [data, setData] = useState<EventDetail | null>(null);
  const [heroUrl, setHeroUrl] = useState<string>("");

  type RelatedWire = {
    id: string;
    slug: string;
    title: string;

    // datas ISO do índice
    startDate: string;           // "2025-10-20T15:00:00.000Z"
    endDate?: string;

    // mídia
    heroImage?: string;
    thumbnail?: string;

    // flags/numéricos
    pricing?: number;
    sponsored?: boolean;
    active?: boolean;

    // relacionais (ids)
    category: string;            // ex: "89d10153-c9af-455a-a9d1-f09f31ab7587"
    categoryName: string;
    categorySlug: string;
    location: string;            // ex: "3e115931-cbd0-4ed3-b612-2fdf2e3862af"
    company: string;             // ex: "07f4ce30-390a-42e4-b6dd-9784ec901685"

    // extras
    facilities?: string[];       // ["Acessibilidade", "Estacionamento", ...]
    updated_at?: string;         // ISO
  };

  const [related, setRelated] = useState<RelatedWire[]>([]);

  const [loadingMain, setLoadingMain] = useState(true);
  const [loadingRelated, setLoadingRelated] = useState(true);

  const [errMain, setErrMain] = useState<string>();
  const [errRel, setErrRel] = useState<string>();

  const acMainRef = useRef<AbortController | null>(null);
  const acRelRef = useRef<AbortController | null>(null);

  // Evento principal
  useEffect(() => {
    if (!id) return;

    setLoadingMain(true);
    setErrMain(undefined);

    acMainRef.current?.abort();
    const ac = new AbortController();
    acMainRef.current = ac;

    (async () => {
      try {
        const res = await getEventBySlug(id, { signal: ac.signal });
        setData(res);
        setHeroUrl(res?.heroImage ? `${baseAppURL}/assets/${res.heroImage}?v=1` : "");
      } catch (e) {
        if (!isAbortError(e)) {
          setErrMain(e instanceof Error ? e.message : "Falha ao carregar evento.");
        }
      } finally {
        setLoadingMain(false);
      }
    })();

    return () => ac.abort();
  }, [id]);

  // Relacionados
  useEffect(() => {
    if (!id) return;

    setLoadingRelated(true);
    setErrRel(undefined);

    acRelRef.current?.abort();
    const ac = new AbortController();
    acRelRef.current = ac;

    (async () => {
      try {
        const list = await getRelatedEventsBySlug(id, { signal: ac.signal });

        const items: RelatedWire[] = (Array.isArray(list) ? list : []).map((src: any) => ({
          id: String(src.id),
          slug: String(src.slug),
          title: String(src.title),

          startDate: String(src.startDate),
          endDate: src.endDate ? String(src.endDate) : undefined,

          heroImage: src.heroImage ?? undefined,
          thumbnail: src.thumbnail ?? undefined,

          pricing: typeof src.pricing === "number" ? src.pricing : undefined,
          sponsored: Boolean(src.sponsored),
          active: Boolean(src.active),

          category: String(src.category),
          categoryName: String(src.categoryName),
          categorySlug: String(src.categorySlug),
          location: String(src.location),
          company: String(src.company),

          facilities: Array.isArray(src.facilities) ? src.facilities.map(String) : undefined,
          updated_at: src.updated_at ? String(src.updated_at) : undefined,
        }));

        setRelated(items);
      } catch (e) {
        if (!isAbortError(e)) {
          setErrRel(e instanceof Error ? e.message : "Falha ao carregar relacionados.");
        }
      } finally {
        setLoadingRelated(false);
      }
    })();

    return () => ac.abort();
  }, [id]);

  const addressText = formatCompanyAddress(data);
  const addressHref = addressText.trim() ? buildMapsLink(addressText) : undefined;

  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 min-h-[70vh]">
        {errMain && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{errMain}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* --------- Coluna principal --------- */}
          <div className="lg:col-span-9">
            {loadingMain ? (
              <>
                <Skeleton className="h-10 w-[70%] mb-6" />
                <BadgesSkeleton />
                <InfoCellsSkeleton />
                <FacilitiesSkeleton />
                <Skeleton className="aspect-[16/9] w-full rounded-lg" />
                <div className="mt-8 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              </>
            ) : data ? (
              <>
                <h1 className="text-5xl font-semibold leading-tight">
                  {data.title}
                </h1>

                {/* Badges: categorias + nome da empresa */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {Array.isArray(data.categories) &&
                    data.categories.map((c) => (
                      <Badge
                        key={`${c.id}-${c.slug}`}
                        variant="outline"
                        className="rounded-sm px-3 py-1 text-xs"
                      >
                        {c.name}
                      </Badge>
                    ))}
                  {/* {data.company?.name && (
                    <Badge variant="outline" className="rounded-sm px-3 py-1 text-xs">
                      {data.company.name}
                    </Badge>
                  )} */}
                </div>

                {/* Info cells: ONDE com col-span 2 */}
                <div className="mt-10 mb-6 grid grid-cols-1 md:grid-cols-5 md:[&>*:not(:first-child)]:border-l">
                  <InfoCell title="ONDE" className="pr-6 md:col-span-2">
                    {addressHref ? (
                      <a
                        href={addressHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium break-words whitespace-pre-line inline-flex items-start gap-1 text-primary hover:underline"
                      >
                        <span>{addressText}</span>
                      </a>
                    ) : (
                      <div className="font-medium break-words whitespace-pre-line">{addressText || "—"}</div>
                    )}
                  </InfoCell>

                  <InfoCell title="QUANDO" className="py-4 pr-6 md:pl-6">
                    {(data.startDate || data.endDate) ? (
                      <div className="text-sm flex items-center">
                        {data.startDate && <span>{fmtDDMMYY_HHMM(data.startDate)}</span>}
                        {data.startDate && data.endDate && (
                          <span
                            aria-hidden
                            className="mx-3 h-5 w-px self-center bg-[hsl(var(--border))]"
                          />
                        )}
                        {data.endDate && <span>{fmtDDMMYY_HHMM(data.endDate)}</span>}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </InfoCell>

                  <InfoCell title="VALOR" className="py-4 pr-6 md:pl-6">
                    <div className="text-sm">
                      {Number.isFinite(data.pricing)
                        ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                          minimumFractionDigits: 2,
                        }).format(Number(data.pricing))
                        : "—"}
                    </div>
                  </InfoCell>

                  <InfoCell title="CONTATO" className="py-4 pr-6 md:pl-6">
                    {data.externalTicketLink ? (
                      <Button asChild variant="link" className="px-0 h-auto">
                        <a href={data.externalTicketLink} target="_blank" rel="noreferrer">
                          Compre seu ingresso
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </InfoCell>
                </div>

                {/* Facilities (com ícones do lucide-react) */}
                {Array.isArray(data.facilities) && data.facilities.length > 0 && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    {data.facilities.map((f) => {
                      const normalized = f.toLowerCase();
                      const Icon =
                        normalized === "acessibilidade"
                          ? Accessibility
                          : normalized === "bicicletário"
                            ? Bike
                            : normalized === "estacionamento"
                              ? ParkingCircle
                              : HelpCircle;

                      return (
                        <div
                          key={f}
                          className="flex items-center gap-2 bg-muted/40 rounded-full px-3 py-1 text-sm text-foreground/90"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{f}</span>
                        </div>
                      );
                    })}
                  </div>
                )}


                {/* Hero */}
                {heroUrl && (
                  <img
                    src={heroUrl}
                    alt={data.title}
                    className="mt-6 aspect-[16/9] w-full object-cover rounded-lg"
                    loading="lazy"
                  />
                )}

                {/* Corpo (com espaçamento ajustado entre <p>) */}
                {data.body && (
                  <div
                    className="
                      mt-8 prose max-w-none
                      [&_p]:my-4 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0
                      [&_p:empty]:m-0 [&_p:empty]:hidden
                    "
                    dangerouslySetInnerHTML={{ __html: data.body }}
                  />
                )}
              </>
            ) : (
              <>
                <Skeleton className="h-10 w-[70%] mb-6" />
                <InfoCellsSkeleton />
                <FacilitiesSkeleton />
                <Skeleton className="aspect-[16/9] w-full rounded-lg" />
              </>
            )}
          </div>

          {/* --------- Sidebar: VEJA TAMBÉM --------- */}
          <aside className="lg:col-span-3 lg:col-start-10 self-start">
            <h3 className="text-3xl font-semibold tracking-wide mb-6">
              VEJA TAMBÉM
            </h3>

            {loadingRelated ? (
              <div className="space-y-8">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i}>
                    <RelatedItemSkeleton />
                    {i < 2 && <Separator className="mt-8" />}
                  </div>
                ))}
              </div>
            ) : errRel ? (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{errRel}</AlertDescription>
              </Alert>
            ) : related.length === 0 ? (
              <div className="text-sm text-muted-foreground">
              </div>
            ) : (
              <div className="space-y-8">
                {related.map((r, i) => {
                  return (
                    <div key={r.slug || i}>
                      <RelatedItem
                        date={formatRelatedDate(r.startDate)}
                        title={r.title}
                        category={(r.categoryName || "").toUpperCase()}
                        href={`/event/${r.slug}`}
                        thumbnail={`${baseAppURL}/assets/${r.thumbnail}`}
                      />
                      {i < related.length - 1 && <Separator className="mt-8" />}
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
