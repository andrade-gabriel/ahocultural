import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getCategoryById, insertCategory, updateCategory } from "@/api/category";

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
import { Textarea } from "@/components/ui/textarea";

/* ---------- cancelar fetch ---------- */
function isAbortError(e: unknown) {
  const any = e as any;
  return (
    any?.name === "CanceledError" ||
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}

/* ---------- idiomas ---------- */
type LangCode = "pt" | "en" | "es";
const LANGS: Array<{ code: LangCode; label: string; flag: string }> = [
  { code: "pt", label: "PT-BR", flag: "pt-br" },
  { code: "en", label: "EN",    flag: "en-us" },
  { code: "es", label: "ES",    flag: "es" },
];

/* ---------- schema ---------- */
const LangValueRequired = z.object({
  pt: z.string().min(1, "Obrigatório"),
  en: z.string().min(1, "Obrigatório"),
  es: z.string().min(1, "Obrigatório"),
});

const LangValueOptional = z.object({
  pt: z.string().optional().nullable(),
  en: z.string().optional().nullable(),
  es: z.string().optional().nullable(),
});

const Schema = z.object({
  active: z.boolean(),
  name: LangValueRequired,
  slug: LangValueRequired,
  description: LangValueOptional.optional().nullable(),
});

type FormValues = z.infer<typeof Schema>;

type NamePath = `name.${LangCode}`;
type SlugPath = `slug.${LangCode}`;
type DescPath  = `description.${LangCode}`;

/* ---------- helpers de path (cada grupo separado) ---------- */
const namePath = (lang: LangCode): NamePath => `name.${lang}`;
const slugPath = (lang: LangCode): SlugPath => `slug.${lang}`;
const descPath = (lang: LangCode): DescPath => `description.${lang}`;

/* ---------- utils ---------- */
const allEmpty = (o?: { pt?: string | null; en?: string | null; es?: string | null } | null) =>
  !o || [o.pt, o.en, o.es].every(v => !v || v.toString().trim() === "");

/* ---------- page ---------- */
export function CategoryDetailLayout() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(idParam);

  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [lang, setLang] = useState<LangCode>("pt"); // aba ativa da UI

  const acRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      active: true,
      name: { pt: "", en: "", es: "" },
      slug: { pt: "", en: "", es: "" },
      description: { pt: "", en: "", es: "" },
    },
    mode: "onTouched",
  });

  /* ---------- GET por id ---------- */
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
        const data = await getCategoryById(idParam, { signal: ac.signal });
        if (reqId !== requestIdRef.current) return;

        const defaults: FormValues = {
          active: !!data.active,
          name: {
            pt: data.name?.pt ?? "",
            en: data.name?.en ?? "",
            es: data.name?.es ?? "",
          },
          slug: {
            pt: data.slug?.pt ?? "",
            en: data.slug?.en ?? "",
            es: data.slug?.es ?? "",
          },
          description: data.description
            ? {
                pt: data.description.pt ?? "",
                en: data.description.en ?? "",
                es: data.description.es ?? "",
              }
            : { pt: "", en: "", es: "" },
        };

        form.reset(defaults);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          setError(e instanceof Error ? e.message : "Falha ao carregar categoria.");
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isEdit]);

  const title = useMemo(() => (isEdit ? "Editar categoria" : "Nova categoria"), [isEdit]);

  /* ---------- SUBMIT ---------- */
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const description =
        allEmpty(values.description)
          ? null
          : {
              pt: values.description?.pt?.trim() ?? "",
              en: values.description?.en?.trim() ?? "",
              es: values.description?.es?.trim() ?? "",
            };

      const payload = {
        id: idParam ?? "",
        name: {
          pt: values.name.pt.trim(),
          en: values.name.en.trim(),
          es: values.name.es.trim(),
        },
        slug: {
          pt: values.slug.pt.trim(),
          en: values.slug.en.trim(),
          es: values.slug.es.trim(),
        },
        description,
        active: values.active,
      };

      if (isEdit && idParam) await updateCategory(idParam, payload as any);
      else await insertCategory(payload as any);

      navigate("/category", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar categoria.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Gerencie os dados multilíngua da categoria</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {isEdit && loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" aria-busy={saving}>
              {/* GRID com menu lateral + campos */}
              <div className="grid gap-6 md:grid-cols-5">
                {/* MENU LATERAL */}
                <aside className="md:col-span-1">
                  <div className="rounded-lg border-r p-2">
                    <div className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">
                      Idiomas
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      {LANGS.map((l) => {
                        const active = l.code === lang;
                        return (
                          <Button
                            key={l.code}
                            type="button"
                            variant={active ? "default" : "outline"}
                            className="justify-start gap-3"
                            onClick={() => setLang(l.code)}
                            aria-pressed={active}
                          >
                            <img
                              src={`/admin/languages/${l.flag}.svg`}
                              alt={l.label}
                              className="h-4 w-4 rounded-full object-cover"
                            />
                            <span className="font-medium">{l.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </aside>

                {/* CAMPOS DO IDIOMA ATIVO
                    key={lang} força o React a remontar os controles quando a aba muda.
                    O estado continua preservado no RHF (form state), então nada é perdido. */}
                <section key={lang} className="md:col-span-4 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={namePath(lang)}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome ({lang.toUpperCase()})</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value} // sempre string pelo schema
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="Nome da categoria"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={slugPath(lang)}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug ({lang.toUpperCase()})</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value}
                              onChange={(e) => field.onChange(e.target.value)}
                              placeholder="nome-da-categoria"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="active"
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

                  <FormField
                    control={form.control}
                    name={descPath(lang)}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição ({lang.toUpperCase()})</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            value={field.value ?? ""} // pode ser undefined
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="Breve descrição da categoria (opcional)"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              </div>

              {/* Ações */}
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
        )}
      </CardContent>

      <CardFooter />
    </Card>
  );
}
