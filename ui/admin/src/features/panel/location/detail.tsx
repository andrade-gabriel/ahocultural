import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler, useFieldArray, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getLocationById,
  insertLocation,
  updateLocation,
  type LocationDetail,
} from "@/api/location";

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

// detectar erro de cancelamento (axios/fetch)
function isAbortError(e: unknown) {
  const any = e as any;
  return (
    any?.name === "CanceledError" ||
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}

/* ---------- helpers ---------- */
function recordToArray(rec: Record<string, string> | undefined): Array<{ name: string; slug: string }> {
  if (!rec) return [];
  return Object.entries(rec).map(([name, slug]) => ({ name, slug }));
}

function arrayToRecord(arr: Array<{ name: string; slug: string }>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of arr) {
    const name = (item?.name ?? "").trim();
    const slug = (item?.slug ?? "").trim();
    if (!name || !slug) continue;
    out[name] = slug;
  }
  return out;
}

/* ---------- schema ---------- */
const DistrictSchema = z.object({
  name: z.string().min(1, "Bairro obrigatório"),
  slug: z.string().min(1, "Slug do bairro obrigatório"),
});

const Schema = z.object({
  country: z.string().min(1, "País obrigatório"),
  countrySlug: z.string().min(1, "Slug do país obrigatório"),
  state: z.string().min(1, "Estado obrigatório"),
  stateSlug: z.string().min(1, "Slug do estado obrigatório"),
  city: z.string().min(1, "Cidade obrigatória"),
  citySlug: z.string().min(1, "Slug da cidade obrigatório"),
  description: z.string().default(""),
  districts: z.array(DistrictSchema).default([]),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof Schema>;
type FormInput = z.input<typeof Schema>;
type FormOutput = z.output<typeof Schema>;

type LocControl = Control<FormInput, any, FormOutput>;
/* ---------- Districts editor ---------- */
function DistrictsEditor({ 
  control
  , disabled 
}: { control: LocControl; disabled?: boolean }) {
  const { fields, append, remove } = useFieldArray({ control, name: "districts" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-base">Bairros e Slugs</FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ name: "", slug: "" })}
          disabled={disabled}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Bairro</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead className="w-[90px]"></TableHead>
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
                  name={`districts.${idx}.name` as const}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(idx)}
                  disabled={disabled}
                  aria-label="Remover linha"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Info className="h-3.5 w-3.5" /> Linhas com campos vazios serão ignoradas no envio.
      </p>
    </div>
  );
}

/* ---------- page ---------- */

export function LocationDetailLayout() {
  const { id: idParam } = useParams(); // /location/:id (em /location/new ficará undefined)
  const navigate = useNavigate();

  const isEdit = Boolean(idParam);

  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const acRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0); // garante "última request vence"

  type FormInput = z.input<typeof Schema>;
  type FormOutput = z.output<typeof Schema>;

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(Schema),
    defaultValues: {
      country: "",
      countrySlug: "",
      state: "",
      stateSlug: "",
      city: "",
      citySlug: "",
      description: "",
      districts: [],
      active: true,
    },
    mode: "onTouched",
  });

  // GET por id (modo edição). Em modo "novo" não carrega nem mostra loader.
  useEffect(() => {
    if (!isEdit || !idParam) return;

    setLoading(true);
    setError(undefined);

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    const reqId = ++requestIdRef.current;

    (async () => {
      try {
        const data = await getLocationById(idParam, { signal: ac.signal });

        if (reqId !== requestIdRef.current) return; // resposta antiga, ignora

        const defaults: FormValues = {
          country: data.country ?? "",
          countrySlug: data.countrySlug ?? "",
          state: data.state ?? "",
          stateSlug: data.stateSlug ?? "",
          city: data.city ?? "",
          citySlug: data.citySlug ?? "",
          description: data.description ?? "",
          districts: recordToArray(data.districtsAndSlugs),
          active: !!data.active,
        };

        form.reset(defaults);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          const msg = e instanceof Error ? e.message : "Falha ao carregar localização.";
          setError(msg);
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isEdit]);

  const title = useMemo(() => (isEdit ? "Editar localização" : "Nova localização"), [isEdit]);

  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const payload: LocationDetail = {
        id: idParam ?? "", // backend pode ignorar em POST
        country: values.country,
        countrySlug: values.countrySlug,
        state: values.state,
        stateSlug: values.stateSlug,
        city: values.city,
        citySlug: values.citySlug,
        description: values.description,
        districtsAndSlugs: arrayToRecord(values.districts),
        active: values.active,
      };

      if (isEdit && idParam) await updateLocation(idParam, payload);
      else await insertLocation(payload);

      navigate("/location", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar localização.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Gerencie os dados de país/estado/cidade e bairros (slugs) da localização</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Loader só quando EXISTE id e ainda não carregou */}
        {isEdit && loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" aria-busy={saving}>
              {/* País/Estado/Cidade */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField name="country" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="state" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="city" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              {/* Slugs */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField name="countrySlug" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Slug País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="stateSlug" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Slug Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="citySlug" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Slug Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>

              {/* Descrição */}
              <FormField name="description" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Breve descrição da localização (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Bairros e slugs (editor de linhas) */}
              <DistrictsEditor control={form.control} disabled={saving} />

              {/* Status */}
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
        )}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
