import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getEventById,
  insertEvent,
  updateEvent,
  type Event,
} from "@/api/event";

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
import { Checkbox } from "@/components/ui/checkbox";
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

/** ---------- TipTap ---------- */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

import {
  CategoryAutocomplete,
  CompanyAutocomplete,
} from "@/components/autocomplete";
// se o caminho do componente for diferente, ajusta aqui:
import { FileUpload } from "@/components/file-upload";
import { getPreviewUrl } from "@/api/file";

/** ---------- Recorrência (seu componente) ---------- */
import { RecurrenceEditor } from "@/components/recurrence";

/** Facilities */
const FACILITY_OPTIONS = ["Acessibilidade", "Estacionamento", "Bicicletário"] as const;
type Facility = (typeof FACILITY_OPTIONS)[number];

/* ---------- helpers ---------- */
function isAbortError(e: unknown) {
  const any = e as any;
  return (
    any?.name === "CanceledError" ||
    any?.code === "ERR_CANCELED" ||
    any?.name === "AbortError" ||
    any?.message === "canceled"
  );
}

function toDatetimeLocalInput(d?: Date | string): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  const hh = `${date.getHours()}`.padStart(2, "0");
  const mi = `${date.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function slugify(v: string) {
  return v
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/* ---------- idiomas ---------- */
type LangCode = "pt" | "en" | "es";
const LANGS: Array<{ code: LangCode; label: string; flag: string }> = [
  { code: "pt", label: "PT-BR", flag: "pt-br" },
  { code: "en", label: "EN", flag: "en-us" },
  { code: "es", label: "ES", flag: "es" },
];

/* ---------- Zod ---------- */
const I18nRequired = z.object({
  pt: z.string().min(1, "Obrigatório"),
  en: z.string().min(1, "Obrigatório"),
  es: z.string().min(1, "Obrigatório"),
});

const RecurrenceSchema = z.object({
  rrule: z.string().min(1, "RRULE é obrigatório"),
  until: z.string().min(1, "Data 'Até' é obrigatória"),
  rdates: z.array(z.string()).optional().default([]),
  exdates: z.array(z.string()).optional().default([]),
});

const Schema = z
  .object({
    title: I18nRequired,
    slug: I18nRequired,
    body: I18nRequired, // HTML por idioma

    // 👇 agora arrays de ids (FileUpload), mas Event espera string
    heroImage: z.array(z.string()).min(1, "Imagem principal obrigatória"),
    thumbnail: z.array(z.string()).min(1, "Thumbnail obrigatória"),

    // alinhado com Event: categoryId / companyId (ids numéricos)
    categoryId: z.string().min(1, "Categoria obrigatória"),
    companyId: z.string().min(1, "Empresa obrigatória"),

    startDate: z.string().min(1, "Início obrigatório"),
    endDate: z.string().min(1, "Fim obrigatório"),
    pricing: z.coerce.number().min(0, "Preço inválido"),
    externalTicketLink: z.string().optional(),

    facilities: z.array(z.enum(FACILITY_OPTIONS)).default([]),
    isSponsored: z.boolean().default(false),
    active: z.boolean().default(true),

    // Toggle + payload de recorrência
    recorrente: z.boolean().default(false),
    recurrence: RecurrenceSchema.optional(),
  })
  // end >= start
  .refine(
    (v) => {
      const s = v.startDate ? new Date(v.startDate) : null;
      const e = v.endDate ? new Date(v.endDate) : null;
      if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return true;
      return e >= s;
    },
    { message: "A data de fim não pode ser anterior ao início.", path: ["endDate"] }
  )
  // until válido quando recorrente
  .refine(
    (v) => {
      if (!v.recorrente) return true;
      if (!v.recurrence?.until) return false;
      const u = new Date(v.recurrence.until);
      return !Number.isNaN(u.getTime());
    },
    { message: "Informe uma data 'Até' válida para a recorrência.", path: ["recurrence.until"] }
  );

type FormValues = z.infer<typeof Schema>;

/* ---------- paths tipados ---------- */
type TitlePath = `title.${LangCode}`;
type SlugPath = `slug.${LangCode}`;
type BodyPath = `body.${LangCode}`;
const titlePath = (lang: LangCode): TitlePath => `title.${lang}` as const;
const slugPath = (lang: LangCode): SlugPath => `slug.${lang}` as const;
const bodyPath = (lang: LangCode): BodyPath => `body.${lang}` as const;

/* ---------- componente ---------- */
export function EventDetailLayout() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(idParam);

  const [loading, setLoading] = useState<boolean>(!!isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [lang, setLang] = useState<LangCode>("pt");
  const [tab, setTab] = useState<"content" | "settings">("content");

  const acRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(Schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      title: { pt: "", en: "", es: "" },
      slug: { pt: "", en: "", es: "" },
      body: { pt: "", en: "", es: "" },

      heroImage: [],
      thumbnail: [],

      categoryId: "",
      companyId: "",
      startDate: "",
      endDate: "",
      pricing: 0,
      externalTicketLink: "",
      facilities: [],
      isSponsored: false,
      active: true,

      recorrente: false,
      recurrence: undefined,
    },
    mode: "onTouched",
  });

  /** ---------- TipTap (controlado por body[lang]) ---------- */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Image,
      Placeholder.configure({
        placeholder: "Escreva a descrição do evento...",
      }),
    ],
    content: "",
    onUpdate({ editor }) {
      const html = editor.getHTML();
      const path = bodyPath(lang);
      form.setValue(path, html, { shouldDirty: true, shouldValidate: true });
    },
  });

  // mantém editor sincronizado com o body do idioma atual
  useEffect(() => {
    if (!editor) return;
    const html = form.getValues(bodyPath(lang));
    editor.commands.setContent(html || "", false);
  }, [lang, editor, form]);

  const titleText = useMemo(
    () => (isEdit ? "Editar evento" : "Novo evento"),
    [isEdit]
  );

  // GET por id (modo edição)
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
        const data = await getEventById(idParam, { signal: ac.signal });
        if (reqId !== requestIdRef.current) return;

        // heroImage / thumbnail vêm como string (id); form usa string[]
        const heroIds = data.heroImage ? [data.heroImage] : [];
        const thumbIds = data.thumbnail ? [data.thumbnail] : [];

        const defaults: FormValues = {
          title: {
            pt: data.title?.pt ?? "",
            en: data.title?.en ?? "",
            es: data.title?.es ?? "",
          },
          slug: {
            pt: data.slug?.pt ?? "",
            en: data.slug?.en ?? "",
            es: data.slug?.es ?? "",
          },
          body: {
            pt: data.body?.pt ?? "",
            en: data.body?.en ?? "",
            es: data.body?.es ?? "",
          },
          heroImage: heroIds,
          thumbnail: thumbIds,
          categoryId: data.categoryId != null ? String(data.categoryId) : "",
          companyId: data.companyId != null ? String(data.companyId) : "",
          startDate: toDatetimeLocalInput(data.startDate),
          endDate: toDatetimeLocalInput(data.endDate),
          pricing: typeof data.pricing === "number" ? data.pricing : 0,
          externalTicketLink: data.externalTicketLink ?? "",
          facilities: Array.isArray(data.facilities)
            ? data.facilities.filter((v: any): v is Facility =>
                FACILITY_OPTIONS.includes(v)
              )
            : [],
          isSponsored: !!data.isSponsored,
          active: !!data.active,

          recorrente: !!data.recurrence,
          recurrence: data.recurrence
            ? {
                rrule: data.recurrence.rrule ?? "",
                until: data.recurrence.until
                  ? new Date(data.recurrence.until).toISOString().slice(0, 10)
                  : "",
                rdates:
                  data.recurrence.rdates?.map((d: any) =>
                    new Date(d).toISOString().slice(0, 10)
                  ) ?? [],
                exdates:
                  data.recurrence.exdates?.map((d: any) =>
                    new Date(d).toISOString().slice(0, 10)
                  ) ?? [],
              }
            : undefined,
        };

        form.reset(defaults);

        // sincroniza editor com o idioma atual
        const html = defaults.body[lang];
        if (editor) {
          editor.commands.setContent(html || "", false);
        }
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          const msg =
            e instanceof Error ? e.message : "Falha ao carregar evento.";
          setError(msg);
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isEdit]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const heroId = values.heroImage[0];
      const thumbId = values.thumbnail[0];

      const payload: Event = {
        id: Number(idParam ?? 0),
        title: {
          pt: values.title.pt.trim(),
          en: values.title.en.trim(),
          es: values.title.es.trim(),
        },
        slug: {
          pt: slugify(values.slug.pt),
          en: slugify(values.slug.en),
          es: slugify(values.slug.es),
        },
        body: {
          pt: values.body.pt,
          en: values.body.en,
          es: values.body.es,
        },

        heroImage: heroId,
        thumbnail: thumbId,

        categoryId: Number(values.categoryId),
        companyId: Number(values.companyId),

        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        pricing: values.pricing,
        externalTicketLink: values.externalTicketLink ?? "",
        facilities: values.facilities,
        isSponsored: values.isSponsored,
        active: values.active,

        // Somente envia recorrência se ligado
        recurrence:
          values.recorrente && values.recurrence
            ? {
                rrule: values.recurrence.rrule.trim(),
                until: new Date(values.recurrence.until),
                rdates: (values.recurrence.rdates ?? []).map(
                  (d) => new Date(d)
                ),
                exdates: (values.recurrence.exdates ?? []).map(
                  (d) => new Date(d)
                ),
              }
            : undefined,
      };

      if (isEdit && idParam) await updateEvent(idParam, payload);
      else await insertEvent(payload);

      navigate("/event", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar evento.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // util: gerar slug a partir do título do idioma atual
  const handleGenerateSlug = () => {
    const currentTitle = form.getValues(titlePath(lang)) ?? "";
    const currentSlug = form.getValues(slugPath(lang)) ?? "";
    if (!currentTitle.trim()) return;
    if (currentSlug && !window.confirm("Substituir o slug atual?")) return;

    const nextSlug = slugify(currentTitle);
    form.setValue(slugPath(lang), nextSlug, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const currentTabIsContent = tab === "content";

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{titleText}</CardTitle>
        <CardDescription>
          Gerencie o conteúdo do evento, imagens, datas e recorrência.
        </CardDescription>
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
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-6"
              aria-busy={saving}
            >
              {/* Aba de navegação simples */}
              <div className="flex gap-2 border-b pb-2 mb-4 text-sm">
                <button
                  type="button"
                  onClick={() => setTab("content")}
                  className={
                    currentTabIsContent
                      ? "border-b-2 border-primary font-medium"
                      : "text-muted-foreground"
                  }
                >
                  Conteúdo
                </button>
                <button
                  type="button"
                  onClick={() => setTab("settings")}
                  className={
                    !currentTabIsContent
                      ? "border-b-2 border-primary font-medium"
                      : "text-muted-foreground"
                  }
                >
                  Configurações
                </button>
              </div>

              {/* Tab Conteúdo */}
              {currentTabIsContent && (
                <div className="grid gap-6">
                  <div className="grid gap-6 md:grid-cols-5">
                    {/* Menu lateral de idiomas */}
                    <aside className="md:col-span-1">
                      <div className="rounded-lg border p-2">
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
                                <span className="font-medium">
                                  {l.label}
                                </span>
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </aside>

                    {/* Campos do idioma ativo */}
                    <section key={lang} className="md:col-span-4 grid gap-4">
                      <FormField
                        control={form.control}
                        name={titlePath(lang)}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título ({lang.toUpperCase()})</FormLabel>
                            <FormControl>
                              <Input
                                name={field.name}
                                ref={field.ref}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value)
                                }
                                onBlur={field.onBlur}
                                placeholder="Título do evento"
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
                            <div className="flex items-center justify-between gap-2">
                              <FormLabel>
                                Slug ({lang.toUpperCase()})
                              </FormLabel>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateSlug}
                              >
                                Gerar slug
                              </Button>
                            </div>
                            <FormControl>
                              <Input
                                name={field.name}
                                ref={field.ref}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value)
                                }
                                onBlur={field.onBlur}
                                placeholder="meu-evento-incrivel"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Editor Rich Text */}
                      <FormField
                        control={form.control}
                        name={bodyPath(lang)}
                        render={() => (
                          <FormItem>
                            <FormLabel>Descrição ({lang.toUpperCase()})</FormLabel>
                            <div className="border rounded-md p-2 min-h-[220px]">
                              <EditorContent editor={editor} />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </section>
                  </div>
                </div>
              )}

              {/* Tab Configurações */}
              {!currentTabIsContent && (
                <div className="grid gap-6">
                  {/* Imagens */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Hero Image */}
                    <FormField
                      control={form.control}
                      name="heroImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Imagem principal</FormLabel>
                          <FormControl>
                            <FileUpload
                              accept="image/*"
                              maxSizeMB={5}
                              maxFiles={1}
                              name={field.name}
                              value={field.value ?? []}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              loadPreview={async (id: any) => {
                                const {
                                  url,
                                  name,
                                  size,
                                  contentType,
                                } = await getPreviewUrl(id);
                                return { url, name, size, contentType };
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Thumbnail */}
                    <FormField
                      control={form.control}
                      name="thumbnail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thumbnail</FormLabel>
                          <FormControl>
                            <FileUpload
                              accept="image/*"
                              maxSizeMB={5}
                              maxFiles={1}
                              name={field.name}
                              value={field.value ?? []}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              loadPreview={async (id: any) => {
                                const {
                                  url,
                                  name,
                                  size,
                                  contentType,
                                } = await getPreviewUrl(id);
                                return { url, name, size, contentType };
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Categoria / Empresa */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Categoria</FormLabel>
                          <FormControl>
                            <CategoryAutocomplete
                              value={
                                field.value
                                  ? String(field.value)
                                  : null
                              }
                              parent={false}
                              onChange={(id) =>
                                field.onChange(id ?? "")
                              }
                              disabled={saving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa</FormLabel>
                          <FormControl>
                            <CompanyAutocomplete
                              value={
                                field.value
                                  ? String(field.value)
                                  : null
                              }
                              onChange={(id) =>
                                field.onChange(id ?? "")
                              }
                              disabled={saving}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Datas / Preço */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Início</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fim</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pricing"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              inputMode="decimal"
                              value={Number.isFinite(field.value as number)
                                ? String(field.value)
                                : ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                field.onChange(
                                  val === "" ? 0 : Number(val)
                                );
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Link externo */}
                  <FormField
                    control={form.control}
                    name="externalTicketLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link externo para ingressos</FormLabel>
                        <FormControl>
                          <Input
                            name={field.name}
                            ref={field.ref}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value)
                            }
                            onBlur={field.onBlur}
                            placeholder="https://..."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Facilities */}
                  <FormField
                    control={form.control}
                    name="facilities"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facilidades</FormLabel>
                        <div className="mt-2 grid gap-2 md:grid-cols-3">
                          {FACILITY_OPTIONS.map((f) => {
                            const checked = field.value?.includes(f);
                            return (
                              <label
                                key={f}
                                className="flex items-center gap-2 text-sm"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const curr = field.value ?? [];
                                    if (v) {
                                      if (!curr.includes(f)) {
                                        field.onChange([...curr, f]);
                                      }
                                    } else {
                                      field.onChange(
                                        curr.filter((x) => x !== f)
                                      );
                                    }
                                  }}
                                />
                                <span>{f}</span>
                              </label>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Recorrência (usa seu componente) */}
                  <FormField
                    control={form.control}
                    name="recorrente"
                    render={({ field }) => (
                      <RecurrenceEditor
                        enabled={field.value}
                        onToggleEnabled={(v) =>
                          field.onChange(Boolean(v))
                        }
                        value={form.watch("recurrence")}
                        onChange={(val) =>
                          form.setValue("recurrence", val, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        disabled={saving}
                      />
                    )}
                  />

                  {/* Flags */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 pt-4">
                          <FormLabel className="mb-0">Ativo</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(v) =>
                                field.onChange(Boolean(v))
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isSponsored"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 pt-4">
                          <FormLabel className="mb-0">
                            Evento patrocinado
                          </FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={(v) =>
                                field.onChange(Boolean(v))
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

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
