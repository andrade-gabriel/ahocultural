// pages/location/detail.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, useFieldArray, type Control, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getLocationById, insertLocation, updateLocation, type LocationDetail } from "@/api/location";
import { getCountries, getStatesByCountryId, getCitiesByStateId } from "@/api/geo";

import SyncSelect from "@/components/autocomplete/SyncSelect";

import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Info, Plus, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Country = { id: number; name: string; iso2?: string };
type StateUF = { id: number; name: string; uf?: string };
type City = { id: number; name: string };

const DistrictSchema = z.object({
  district: z.string().min(1, "Bairro obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
});
const Schema = z.object({
  countryId: z.number().int().positive({ message: "Selecione um país" }),
  stateId: z.number().int().positive({ message: "Selecione um estado" }),
  cityId: z.number().int().positive({ message: "Selecione uma cidade" }),
  description: z.string().default(""),
  districts: z.array(DistrictSchema).default([]),
  active: z.boolean().default(true),
});
type FormInput = z.input<typeof Schema>;
type FormOutput = z.output<typeof Schema>;
type LocControl = Control<FormInput, any, FormOutput>;

const toId = (v: unknown): number | null => {
  const n = typeof v === "string" ? Number(v) : (typeof v === "number" ? v : NaN);
  return Number.isFinite(n) && n > 0 ? n : null;
};

function DistrictsEditor({ control, disabled }: { control: LocControl; disabled?: boolean }) {
  const { fields, append, remove } = useFieldArray({ control, name: "districts" });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-base">Bairros e Slugs</FormLabel>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ district: "", slug: "" })} disabled={disabled} className="gap-2">
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bairro</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="w-[90px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-sm text-muted-foreground">
                Nenhum bairro adicionado. Clique em <span className="font-medium">Adicionar</span>.
              </TableCell>
            </TableRow>
          ) : null}

          {fields.map((f, idx) => (
            <TableRow key={f.id}>
              <TableCell>
                <FormField
                  name={`districts.${idx}.district` as const}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Ex.: Vila Olímpia" disabled={disabled} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell>
                <FormField
                  name={`districts.${idx}.slug` as const}
                  control={control}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Ex.: vila-olimpia" disabled={disabled} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(idx)} disabled={disabled} aria-label="Remover linha">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Info className="h-3.5 w-3.5" /> Linhas vazias serão ignoradas no envio.
      </p>
    </div>
  );
}

export function LocationDetailLayout() {
  const { id: idParam } = useParams();
  const isEdit = Boolean(idParam);
  const navigate = useNavigate();

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(Schema),
    defaultValues: {
      countryId: undefined as unknown as number,
      stateId: undefined as unknown as number,
      cityId: undefined as unknown as number,
      description: "",
      districts: [],
      active: true,
    },
    mode: "onTouched",
  });

  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const [bootLoading, setBootLoading] = useState(true);
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [states, setStates]       = useState<StateUF[] | null>(null);
  const [cities, setCities]       = useState<City[] | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    let alive = true;

    (async () => {
      try {
        setError(undefined);
        setBootLoading(true);

        if (isEdit && idParam) {
          const loc = await getLocationById(Number(idParam), { signal: ac.signal });
          if (!alive) return;

          const ctryId = toId((loc as any)?.countryId);
          const stId   = toId((loc as any)?.stateId);
          const ctId   = toId((loc as any)?.cityId);

          const [cs, sts, cts] = await Promise.all([
            getCountries({ signal: ac.signal }),
            ctryId ? getStatesByCountryId(ctryId!, { signal: ac.signal }) : Promise.resolve<StateUF[]>([]),
            stId   ? getCitiesByStateId(stId!,   { signal: ac.signal })   : Promise.resolve<City[]>([]),
          ]);
          if (!alive) return;

          setCountries(cs);
          setStates(sts);
          setCities(cts);

          form.reset({
            countryId: (ctryId ?? undefined) as unknown as number,
            stateId:   (stId   ?? undefined) as unknown as number,
            cityId:    (ctId   ?? undefined) as unknown as number,
            description: (loc as any)?.description ?? "",
            districts:  ((loc as any)?.districts ?? []).map((d: any) => ({ district: d.district, slug: d.slug })),
            active: Boolean((loc as any)?.active),
          });
        } else {
          const cs = await getCountries({ signal: ac.signal });
          if (!alive) return;
          setCountries(cs);
          setStates(null);
          setCities(null);
        }
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Falha ao carregar dados.");
      } finally {
        if (alive) setBootLoading(false);
      }
    })();

    return () => { alive = false; ac.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isEdit]);

  const handleCountryChange = async (value: string | null) => {
    const id = toId(value);
    form.setValue("countryId", id ?? (undefined as unknown as number));
    form.setValue("stateId", undefined as unknown as number);
    form.setValue("cityId",  undefined as unknown as number);
    setStates(null);
    setCities(null);
    if (id) {
      try {
        const sts = await getStatesByCountryId(id);
        setStates(sts);
      } catch (e) {
        setStates([]);
        setError(e instanceof Error ? e.message : "Falha ao carregar estados.");
      }
    }
  };

  const handleStateChange = async (value: string | null) => {
    const id = toId(value);
    form.setValue("stateId", id ?? (undefined as unknown as number));
    form.setValue("cityId", undefined as unknown as number);
    setCities(null);
    if (id) {
      try {
        const cts = await getCitiesByStateId(id);
        setCities(cts);
      } catch (e) {
        setCities([]);
        setError(e instanceof Error ? e.message : "Falha ao carregar cidades.");
      }
    }
  };

  const handleCityChange = (value: string | null) => {
    const id = toId(value);
    form.setValue("cityId", id ?? (undefined as unknown as number));
  };

  const loadCountries = async () => countries ?? [];
  const loadStates    = async () => states ?? [];
  const loadCities    = async () => cities ?? [];

  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const payload: LocationDetail = {
        id: isEdit ? Number(idParam) : 0,
        countryId: Number(values.countryId),
        stateId:   Number(values.stateId),
        cityId:    Number(values.cityId),
        description: values.description ?? "",
        districts: (values.districts ?? []).map(d => ({ district: d.district.trim(), slug: d.slug.trim() })),
        active: Boolean(values.active),
      };

      if (isEdit) await updateLocation(Number(idParam), payload);
      else await insertLocation(payload);

      navigate("/location", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar localização.");
    } finally {
      setSaving(false);
    }
  };

  const title = useMemo(() => (isEdit ? "Editar localização" : "Nova localização"), [isEdit]);

  const countriesReady = countries !== null;
  const statesReady    = states    !== null && toId(form.getValues("countryId")) !== null;
  const citiesReady    = cities    !== null && toId(form.getValues("stateId"))   !== null;

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
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </CardContent>
        <CardFooter />
      </Card>
    );
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Selecione País → Estado → Cidade, e gerencie os bairros.</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" aria-busy={saving}>
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                name="countryId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <SyncSelect<Country>
                        load={loadCountries}
                        getOptionLabel={(c) => c.name}
                        getOptionValue={(c) => String(c.id)}
                        value={field.value ? String(field.value) : null}
                        onChange={handleCountryChange}
                        placeholder={countriesReady ? "Selecionar país..." : "Carregando países..."}
                        disabled={!countriesReady}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="stateId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <SyncSelect<StateUF>
                        key={`state-${form.getValues("countryId") ?? "none"}`}
                        load={loadStates}
                        getOptionLabel={(s) => s.uf ? `${s.name} (${s.uf})` : s.name}
                        getOptionValue={(s) => String(s.id)}
                        value={field.value ? String(field.value) : null}
                        onChange={handleStateChange}
                        placeholder={
                          !toId(form.getValues("countryId"))
                            ? "Selecione um país..."
                            : (states === null ? "Carregando estados..." : "Selecionar estado...")
                        }
                        disabled={!statesReady}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="cityId"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
                    <FormControl>
                      <SyncSelect<City>
                        key={`city-${form.getValues("stateId") ?? "none"}`}
                        load={loadCities}
                        getOptionLabel={(c) => c.name}
                        getOptionValue={(c) => String(c.id)}
                        value={field.value ? String(field.value) : null}
                        onChange={handleCityChange}
                        placeholder={
                          !toId(form.getValues("stateId"))
                            ? "Selecione um estado..."
                            : (cities === null ? "Carregando cidades..." : "Selecionar cidade...")
                        }
                        disabled={!citiesReady}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField name="description" control={form.control} render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="Breve descrição (opcional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DistrictsEditor control={form.control} disabled={saving} />

            <div className="grid gap-4 md:grid-cols-3">
              <FormField name="active" control={form.control} render={({ field }) => (
                <FormItem className="flex items-center gap-3 pt-6">
                  <FormLabel className="mb-0">Ativa</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                  </FormControl>
                </FormItem>
              )} />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /><span className="sr-only">Salvando</span></> : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter />
    </Card>
  );
}
