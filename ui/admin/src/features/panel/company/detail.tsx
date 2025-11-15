import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getCompanyById,
  insertCompany,
  updateCompany,
  type CompanyDetail,
} from "@/api/company";
import { listLocations, getLocationById } from "@/api/location";
import { getAddressByCep, getGeoByAddress } from "@/api/geo/actions";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import SyncSelect from "@/components/autocomplete/SyncSelect";
import { Skeleton } from "@/components/ui/skeleton";

/* utils */
function isAbortError(e: unknown) {
  const any = e as any;
  return (
    any?.name === "CanceledError" ||
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}
function onlyDigits(s: string) {
  return (s || "").replace(/\D/g, "");
}
function formatCep(maskable: string) {
  const d = onlyDigits(maskable).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
function debounce<F extends (...args: any[]) => void>(fn: F, ms: number) {
  let t: any;
  return (...args: Parameters<F>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/* schema */
const AddressSchema = z.object({
  locationId: z
    .coerce
    .number()
    .int()
    .min(1, "Selecione uma localização")
    .default(0),
  locationDistrictId: z.number().int().default(0),
  street: z.string().default(""),
  number: z.string().default(""),
  complement: z.string().default(""),
  district: z.string().default(""),
  postal_code: z.string().default(""),
});
const GeoSchema = z.object({
  lat: z.coerce.number().default(0),
  lng: z.coerce.number().default(0),
});
const Schema = z.object({
  id: z.number().nullable().default(0).optional(),
  slug: z.string().min(1, "Slug obrigatório"),
  name: z.string().min(1, "Nome obrigatório"),
  active: z.boolean(),
  address: AddressSchema,
  geo: GeoSchema,
});

type FormValues = z.infer<typeof Schema>;
type LocationOption = { id: string | number; name: string; description?: string };
type DistrictOption = { id: number; name: string };

/* readOnly look */
const roInput =
  "bg-muted/60 text-muted-foreground border-dashed cursor-not-allowed " +
  "focus:outline-none focus-visible:ring-0 focus:ring-0";

/* normalizador de districts */
function normalizeDistricts(input: any[]): DistrictOption[] {
  const seen = new Set<number>();
  const out: DistrictOption[] = [];
  for (const raw of input ?? []) {
    const idNum = Number(raw?.id);
    const nameStr = String(raw?.district ?? raw?.name ?? "").trim();
    if (!Number.isFinite(idNum) || idNum <= 0) continue;
    if (!nameStr) continue;
    if (seen.has(idNum)) continue;
    seen.add(idNum);
    out.push({ id: idNum, name: nameStr });
  }
  return out;
}

export function CompanyDetailLayout() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();

  const [bootLoading, setBootLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [locations, setLocations] = useState<LocationOption[] | null>(null);

  /* distritos */
  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [districtLoading, setDistrictLoading] = useState(false);

  /* loaders auxiliares */
  const [cepLoading, setCepLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const geoReqRef = useRef<AbortController | null>(null);

  const form = useForm<z.input<typeof Schema>, any, z.output<typeof Schema>>({
    resolver: zodResolver(Schema),
    defaultValues: {
      id: 0,
      name: "",
      slug: "",
      active: true,
      address: {
        locationId: 0,
        locationDistrictId: 0,
        street: "",
        number: "",
        complement: "",
        district: "",
        postal_code: "",
      },
      geo: { lat: 0, lng: 0 },
    },
    mode: "onTouched",
  });

  function clearAddressAndGeo() {
    form.setValue("address.street", "", { shouldDirty: true });
    form.setValue("address.district", "", { shouldDirty: true });
    form.setValue("geo.lat", 0, { shouldDirty: true });
    form.setValue("geo.lng", 0, { shouldDirty: true });
  }

  async function fetchDistrictsFor(locationId: number, signal?: AbortSignal) {
    const loc = await getLocationById(locationId, { signal });
    const ds = normalizeDistricts(loc?.districts ?? []);
    setDistricts(ds);
    return ds;
  }

  /* BOOT */
  useEffect(() => {
    let cancelled = false;
    setBootLoading(true);
    setError(undefined);

    const ac = new AbortController();

    (async () => {
      try {
        const [locItems, data] = await Promise.all([
          listLocations({ skip: 0, take: 1000 }, { signal: ac.signal }),
          idParam
            ? getCompanyById(idParam, { signal: ac.signal })
            : Promise.resolve(undefined),
        ]);

        if (cancelled) return;

        const mapped: LocationOption[] = (locItems ?? []).map((l) => ({
          id: l.id,
          name: `${l.city}${l.state ? `/${l.state}` : ""}`,
          description: l.country,
        }));
        setLocations(mapped);

        if (data) {
          const defaults: FormValues = {
            id: data.id ?? 0,
            name: data.name ?? "",
            slug: data.slug ?? "",
            active: !!data.active,
            address: {
              locationId: data.address?.locationId ?? 0,
              locationDistrictId: data.address?.locationDistrictId ?? 0,
              street: data.address?.street ?? "",
              number: data.address?.number ?? "",
              complement: data.address?.complement ?? "",
              district: data.address?.district ?? "",
              postal_code: data.address?.postal_code ?? "",
            },
            geo: {
              lat: data.geo?.lat ?? 0,
              lng: data.geo?.lng ?? 0,
            },
          };

          form.reset(defaults);
        } else {
          setDistricts([]);
        }
      } catch (e) {
        if (!isAbortError(e)) {
          setError(
            e instanceof Error ? e.message : "Falha ao carregar dados."
          );
        }
      } finally {
        if (!cancelled) setBootLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [idParam]);

  /* WATCH locationId */
  const locationIdRaw = form.watch("address.locationId");
  useEffect(() => {
    const locId = Number(locationIdRaw) || 0;

    if (!locId) {
      setDistricts([]);
      form.setValue("address.locationDistrictId", 0, { shouldDirty: true });
      return;
    }

    const ac = new AbortController();

    (async () => {
      try {
        setDistrictLoading(true);
        const ds = await fetchDistrictsFor(locId, ac.signal);
        const current = form.getValues("address.locationDistrictId");

        if (current != null && ds.some((x) => x.id === Number(current))) {
          return;
        }

        if (current != null) {
          form.setValue("address.locationDistrictId", 0, {
            shouldDirty: true,
          });
        }
      } catch (e) {
        if (!isAbortError(e)) {
          console.error("Erro ao carregar distritos:", e);
        }
        setDistricts([]);
        form.setValue("address.locationDistrictId", 0, { shouldDirty: true });
      } finally {
        setDistrictLoading(false);
      }
    })();

    return () => ac.abort();
  }, [locationIdRaw]);

  const title = useMemo(
    () => (idParam ? "Editar empresa" : "Nova empresa"),
    [idParam]
  );

  const onSubmit: SubmitHandler<z.output<typeof Schema>> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);
      const payload: CompanyDetail = {
        id: values.id ?? 0,
        name: values.name,
        slug: values.slug,
        active: values.active,
        address: {
          ...values.address,
          locationId: Number(values.address.locationId || 0),
          locationDistrictId: values.address.locationDistrictId ?? null,
        },
        geo: values.geo,
      };
      if (idParam) await updateCompany(idParam, payload);
      else await insertCompany(payload);
      navigate("/company", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar empresa.");
      console.error("[CompanyDetail] submit:error", e);
    } finally {
      setSaving(false);
    }
  };

  const loadLocations = async () => locations ?? [];
  const loadDistricts = async () => normalizeDistricts(districts);

  /* CEP */
  const cepValue = form.watch("address.postal_code");
  useEffect(() => {
    const digits = onlyDigits(cepValue ?? "");
    if (digits.length !== 8) {
      clearAddressAndGeo();
      return;
    }

    const ac = new AbortController();
    (async () => {
      try {
        setCepLoading(true);
        const via = await getAddressByCep(digits, { signal: ac.signal });

        form.setValue("address.street", via.street ?? "", { shouldDirty: true });
        form.setValue("address.district", via.district ?? "", { shouldDirty: true });

        if (locations && via.city && via.state) {
          const cityState = `${via.city}/${via.state}`;
          const match = locations.find((l) => l.name === cityState);
          if (match) {
            form.setValue("address.locationId", Number(match.id), {
              shouldDirty: true,
              shouldValidate: true,
            });
          }
        }

        const number = form.getValues("address.number");
        if (number) {
          setGeoLoading(true);
          const geo = await getGeoByAddress(
            {
              street: via.street ?? "",
              number,
              district: via.district ?? "",
              city: via.city ?? "",
              state: via.state ?? "",
              country: "Brasil",
            },
            { signal: ac.signal }
          );

          if (geo) {
            form.setValue("geo.lat", geo.lat, { shouldDirty: true });
            form.setValue("geo.lng", geo.lng, { shouldDirty: true });
          } else {
            clearAddressAndGeo();
          }
        }
      } catch (err) {
        if (!isAbortError(err)) {
          console.error("CEP lookup error:", err);
          clearAddressAndGeo();
        }
      } finally {
        setCepLoading(false);
        setGeoLoading(false);
      }
    })();

    return () => ac.abort();
  }, [cepValue, locations, form]);

  /* geocode ao mudar número */
  const street = form.watch("address.street");
  const districtText = form.watch("address.district"); // do ViaCEP
  const number = form.watch("address.number");

  const doGeocode = useRef(
    debounce(
      async (payload: {
        street: string;
        district?: string;
        number: string;
        city: string;
        state: string;
      }) => {
        geoReqRef.current?.abort();
        const ac = new AbortController();
        geoReqRef.current = ac;
        try {
          setGeoLoading(true);
          const geo = await getGeoByAddress(
            {
              street: payload.street,
              number: payload.number,
              district: payload.district,
              city: payload.city,
              state: payload.state,
              country: "Brasil",
            },
            { signal: ac.signal }
          );
          if (geo) {
            form.setValue("geo.lat", geo.lat, { shouldDirty: true });
            form.setValue("geo.lng", geo.lng, { shouldDirty: true });
          } else {
            clearAddressAndGeo();
          }
        } catch (e) {
          if (!isAbortError(e)) {
            console.error("Geocode error:", e);
            clearAddressAndGeo();
          }
        } finally {
          setGeoLoading(false);
        }
      },
      900
    )
  ).current;

  useEffect(() => {
    const locOpt = locations?.find(
      (l) => Number(l.id) === Number(form.getValues("address.locationId"))
    );
    const cityState = locOpt?.name || "";
    const [city, state] = cityState.includes("/")
      ? cityState.split("/")
      : ["", ""];
    if (!street || !number || !city || !state) return;
    doGeocode({ street, district: districtText, number, city, state });
  }, [street, districtText, number, locations, form, doGeocode]);

  /* UI */
  if (bootLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader>
          <div className="space-y-2">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasLocation = Number(form.watch("address.locationId") || 0) > 0;
  const hasDistrictOptions = districts.length > 0;

  const districtPlaceholder =
    !hasDistrictOptions && !hasLocation
      ? "Selecione uma cidade antes"
      : !hasDistrictOptions && hasLocation && districtLoading
      ? "Carregando..."
      : hasDistrictOptions
      ? "Selecione o bairro..."
      : "Sem bairros para esta cidade";

  const districtDisabled =
    (!hasLocation && !hasDistrictOptions) || // sem cidade e sem lista
    (districtLoading && !hasDistrictOptions); // ainda carregando a primeira lista

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Mantenha os dados da empresa alinhados ao cadastro de locais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: Restaurante Maní" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex.: restaurante-mani"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="address.locationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade / Estado</FormLabel>
                    <FormControl>
                      <SyncSelect<LocationOption>
                        load={loadLocations}
                        getOptionLabel={(l) => l.name}
                        getOptionValue={(l) => String(l.id)}
                        value={
                          Number(field.value) ? String(field.value) : null
                        }
                        onChange={(id) =>
                          field.onChange(id ? Number(id) : 0)
                        }
                        placeholder={
                          locations
                            ? "Selecionar localização..."
                            : "Carregando..."
                        }
                        disabled={!locations}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.locationDistrictId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro (Distrito) — custom</FormLabel>
                    <FormControl>
                      <SyncSelect<DistrictOption>
                        key={`district-${String(
                          form.watch("address.locationId") || ""
                        )}`}
                        load={loadDistricts}
                        getOptionLabel={(d) => d.name}
                        getOptionValue={(d) => String(d.id)}
                        value={
                          field.value != null ? String(field.value) : null
                        }
                        onChange={(id) =>
                          field.onChange(id ? Number(id) : null)
                        }
                        placeholder={districtPlaceholder}
                        disabled={districtDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                name="address.postal_code"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      CEP{" "}
                      {cepLoading && (
                        <span className="text-xs">(buscando…)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        inputMode="numeric"
                        value={formatCep(field.value ?? "")}
                        onChange={(e) =>
                          field.onChange(formatCep(e.currentTarget.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                name="address.street"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logradouro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex.: Alameda Fernão Cardim"
                        className={roInput}
                        {...field}
                        readOnly
                        aria-readonly="true"
                        title="Preenchido automaticamente pelo CEP"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="address.district"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro (do CEP)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex.: Vila Olímpia"
                        {...field}
                        className={roInput}
                        readOnly
                        aria-readonly="true"
                        title="Preenchido automaticamente pelo CEP (não é o distrito custom)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="address.number"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Número{" "}
                      {geoLoading && (
                        <span className="text-xs">(geocodificando…)</span>
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex.: 39" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="address.complement"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex.: loja 418, 3º piso"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="geo.lat"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        className={roInput}
                        value={Number(field.value ?? 0)}
                        readOnly
                        onChange={() => {}}
                        placeholder="Ex.: -23.561684"
                        aria-readonly="true"
                        title="Preenchido automaticamente pela geocodificação"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="geo.lng"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        className={roInput}
                        value={Number(field.value ?? 0)}
                        readOnly
                        onChange={() => {}}
                        placeholder="Ex.: -46.656139"
                        aria-readonly="true"
                        title="Preenchido automaticamente pela geocodificação"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                name="active"
                control={form.control}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 pt-6">
                    <FormLabel className="mb-0">Ativa</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(Boolean(v))}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="sr-only">Salvando</span>
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter />
    </Card>
  );
}