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
import { Loader2 } from "lucide-react";
import { LocationAutocomplete } from "@/components/autocomplete";

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

/* ---------- schema ---------- */

const AddressSchema = z.object({
  street: z.string().default(""),
  number: z.string().default(""),
  complement: z.string().default(""),
  district: z.string().default(""),
  city: z.string().default(""),
  state: z.string().default(""),
  state_full: z.string().default(""),
  postal_code: z.string().default(""),
  country: z.string().default(""),
  country_code: z.string().default(""),
});

const GeoSchema = z.object({
  lat: z.coerce.number().default(0),
  lng: z.coerce.number().default(0)
});

const Schema = z.object({
  id: z.string().default('').optional(),
  slug: z.string().min(1, "Slug obrigatório"),
  name: z.string().min(1, "Nome obrigatório"),
  active: z.boolean(),
  address: AddressSchema,
  location: z.string().default(""),
  geo: GeoSchema,
});
type FormValues = z.infer<typeof Schema>;

/* ---------- page ---------- */

export function CompanyDetailLayout() {
  const { id: idParam } = useParams(); // /company/:id
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(!!idParam);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const acRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0); // garante "última request vence"

  type FormInput = z.input<typeof Schema>;
  type FormOutput = z.output<typeof Schema>;

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(Schema),
    defaultValues: {
      id: "",
      name: "",
      slug: "",
      active: true,
      address: {
        street: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
        state_full: "",
        postal_code: "",
        country: "",
        country_code: "",
      },
      location: '',
      geo: {
        lat: 0
        , lng: 0
      },
    },
    mode: "onTouched",
  });

  // GET por id (modo edição). Em modo "novo" não carrega nem mostra loader.
  useEffect(() => {
    if (!idParam) return;

    setLoading(true);
    setError(undefined);

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    const reqId = ++requestIdRef.current;

    (async () => {
      try {
        const data = await getCompanyById(idParam, { signal: ac.signal });

        if (reqId !== requestIdRef.current) return; // resposta antiga, ignora

        const defaults: FormValues = {
          id: data.id ?? "",
          name: data.name ?? "",
          slug: data.slug ?? "",
          active: !!data.active,
          address: {
            street: data.address?.street ?? "",
            number: data.address?.number ?? "",
            complement: data.address?.complement ?? "",
            district: data.address?.district ?? "",
            city: data.address?.city ?? "",
            state: data.address?.state ?? "",
            state_full: data.address?.state_full ?? "",
            postal_code: data.address?.postal_code ?? "",
            country: data.address?.country ?? "",
            country_code: data.address?.country_code ?? "",
          },
          location: data.location ?? '',
          geo: {
            lat: data.geo?.lat ?? 0
            , lng: data.geo?.lng ?? 0
          },
        };

        form.reset(defaults);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          const msg = e instanceof Error ? e.message : "Falha ao carregar empresa.";
          setError(msg);
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam]);

  const title = useMemo(() => (idParam ? "Editar empresa" : "Nova empresa"), [idParam]);

  const onSubmit: SubmitHandler<FormOutput> = async (values: FormOutput) => {

    try {
      setSaving(true);
      setError(undefined);

      const idForPath = idParam;

      // envia o objeto COMPLETO sempre (alinha com seu backend)
      const payload: CompanyDetail = {
        id: values.id ?? '',
        name: values.name,
        slug: values.slug,
        active: values.active,
        address: {
          street: values.address.street,
          number: values.address.number,
          complement: values.address.complement,
          district: values.address.district,
          city: values.address.city,
          state: values.address.state,
          state_full: values.address.state_full,
          postal_code: values.address.postal_code,
          country: values.address.country,
          country_code: values.address.country_code,
        },
        location: values.location,
        geo: {
          lat: values.geo.lat,
          lng: values.geo.lng
        }
      };
      if (idForPath)
        await updateCompany(idForPath, payload);
      else
        await insertCompany(payload);
      navigate("/company", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar empresa.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Gerencie os dados da empresa</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Loader só quando EXISTE id e ainda não carregou */}
        {idParam && loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" aria-busy={saving}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="nome-da-empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Endereço */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField name="address.postal_code" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.street" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Logradouro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.number" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Número</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.complement" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.district" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.city" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.state" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>UF</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.state_full" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.country" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>País</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="address.country_code" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Cód. País</FormLabel><FormControl><Input maxLength={2} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                {/* Categoria / Imagem */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ponto de Referência</FormLabel>
                      <FormControl>
                        <LocationAutocomplete
                          value={field.value ? String(field.value) : null}
                          onChange={(id) => field.onChange(id ?? "")}
                          disabled={saving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Geo + Status */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField name="geo.lat" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        // field.value aqui é unknown por causa do TFieldValues (input de zod)
                        value={(field.value as number | undefined) ?? ""}
                        onChange={(e) => {
                          const v = e.currentTarget.valueAsNumber;
                          field.onChange(Number.isFinite(v) ? v : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField name="geo.lng" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        value={(field.value as number | undefined) ?? ""}
                        onChange={(e) => {
                          const v = e.currentTarget.valueAsNumber;
                          field.onChange(Number.isFinite(v) ? v : undefined);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

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
