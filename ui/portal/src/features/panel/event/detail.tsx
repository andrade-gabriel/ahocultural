import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
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
function formatCompanyAddress(ev?: EventDetail): string {
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

/** Data editorial (CAIXA ALTA) para “Veja também” */
function formatRelatedDate(start?: DateInput, end?: DateInput, tz = "America/Sao_Paulo") {
  const s = toDate(start);
  const e = toDate(end);
  if (!s) return "";

  const up = (str: string) => str.toUpperCase();
  const day = (d: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: tz, day: "2-digit" }).format(d);
  const monthLong = (d: Date) => up(new Intl.DateTimeFormat("pt-BR", { timeZone: tz, month: "long" }).format(d));
  const year = (d: Date) => new Intl.DateTimeFormat("pt-BR", { timeZone: tz, year: "numeric" }).format(d);

  if (!e || s.getTime() === e.getTime()) {
    return `${day(s)} ${monthLong(s)} ${year(s)}`;
  }
  const sameMonthYear =
    s.getUTCFullYear() === e.getUTCFullYear() &&
    s.getUTCMonth() === e.getUTCMonth();

  if (sameMonthYear) {
    return `DE ${day(s)} A ${day(e)} ${monthLong(e)} ${year(e)}`;
  }
  return `DE ${day(s)} ${monthLong(s)} ${year(s)} A ${day(e)} ${monthLong(e)} ${year(e)}`;
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

const RelatedItem = ({
  date,
  venue,
  title,
  category,
  href,
}: {
  date: string;
  venue: string;
  title: string;
  category: string;
  href?: string;
}) => (
  <div className="border-l pl-4">
    <div className="text-xs uppercase text-muted-foreground">{date}</div>
    <div className="mt-1 text-sm font-semibold">{venue}</div>
    {href ? (
      <a
        href={href}
        className="mt-1 block text-lg font-medium leading-snug hover:underline underline-offset-4"
      >
        {title}
      </a>
    ) : (
      <span className="mt-1 block text-lg font-medium leading-snug">
        {title}
      </span>
    )}
    <div className="mt-1 text-xs uppercase text-muted-foreground">{category}</div>
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
    slug: string;
    title: string;
    categories?: Array<{ name?: string }>;
    company?: { name?: string; address?: { city?: string; state?: string } };
    location?: string; // legado/compat
    startDate?: string | Date;
    endDate?: string | Date;
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

        const items: RelatedWire[] = (Array.isArray(list) ? list : []).map((e: any) => ({
          slug: String(e.slug ?? ""),
          title: String(e.title ?? ""),
          categories: Array.isArray(e.categories) ? e.categories : undefined,
          company: e.company,
          location: e.location, // legado
          startDate: e.startDate ?? null,
          endDate: e.endDate ?? null,
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
          <div className="lg:col-span-8">
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
          <aside className="lg:col-span-4 lg:col-start-9 self-start">
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
                Nenhum evento relacionado.
              </div>
            ) : (
              <div className="space-y-8">
                {related.map((r, i) => {
                  const categoryName = (r.categories && r.categories[0]?.name) || "";
                  const venue =
                    r.company?.name ||
                    [r.company?.address?.city, r.company?.address?.state]
                      .filter(Boolean)
                      .join(" - ") ||
                    r.location ||
                    "—";

                  return (
                    <div key={r.slug || i}>
                      <RelatedItem
                        date={formatRelatedDate(r.startDate, r.endDate)}
                        venue={venue}
                        title={r.title}
                        category={(categoryName || "").toUpperCase()}
                        href={`${baseAppURL}/event/${r.slug}`}
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
