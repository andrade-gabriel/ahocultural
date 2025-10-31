import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getEventById,
  insertEvent,
  updateEvent,
  type EventDetail,
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

import { CategoryAutocomplete, CompanyAutocomplete } from "@/components/autocomplete";
import { FileUpload } from "@/components/file-upload";
import { getPreviewUrl } from "@/api/file";

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

/* ---------- schema (multilíngue) ---------- */
const I18nRequired = z.object({
  pt: z.string().min(1, "Obrigatório"),
  en: z.string().min(1, "Obrigatório"),
  es: z.string().min(1, "Obrigatório"),
});

const Schema = z
  .object({
    title: I18nRequired,
    slug: I18nRequired,
    body: I18nRequired, // HTML por idioma
    heroImage: z.string().min(1, "Imagem principal obrigatória"),
    thumbnail: z.string().min(1, "Thumbnail obrigatória"),
    category: z.string().min(1, "Categoria obrigatória"),
    company: z.string().min(1, "Empresa obrigatória"),
    location: z.string().min(1, "Local obrigatório"), // ⬅️ adicionado
    startDate: z.string().min(1, "Início obrigatório"),
    endDate: z.string().min(1, "Fim obrigatório"),
    pricing: z.coerce.number().min(0, "Preço inválido"),
    externalTicketLink: z.string().optional(),
    facilities: z.array(z.enum(FACILITY_OPTIONS)).default([]),
    sponsored: z.boolean().default(false),
    active: z.boolean().default(true),
  })
  .refine(
    (v) => {
      const s = v.startDate ? new Date(v.startDate) : null;
      const e = v.endDate ? new Date(v.endDate) : null;
      if (!s || !e || Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return true;
      return e >= s;
    },
    { message: "A data de fim não pode ser anterior ao início.", path: ["endDate"] }
  );

type FormValues = z.infer<typeof Schema>;

/* ---------- typed field paths ---------- */
type TitlePath = `title.${LangCode}`;
type SlugPath = `slug.${LangCode}`;
type BodyPath = `body.${LangCode}`;
const titlePath = (lang: LangCode): TitlePath => `title.${lang}` as const;
const slugPath = (lang: LangCode): SlugPath => `slug.${lang}` as const;
const bodyPath = (lang: LangCode): BodyPath => `body.${lang}` as const;

/* ---------- page ---------- */
export function EventDetailLayout() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(idParam);

  const [loading, setLoading] = useState<boolean>(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [lang, setLang] = useState<LangCode>("pt");

  const acRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // ------------ RHF: force same generics across Form/FormField/resolver ------------
  const form = useForm<FormValues, any, FormValues>({
    // O cast do Resolver garante compat em projetos com versões distintas de RHF/resolvers
    resolver: zodResolver(Schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      title: { pt: "", en: "", es: "" },
      slug: { pt: "", en: "", es: "" },
      body: { pt: "", en: "", es: "" },
      heroImage: "",
      thumbnail: "",
      category: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      pricing: 0,
      externalTicketLink: "",
      facilities: [],
      sponsored: false,
      active: true,
    },
    mode: "onTouched",
  });

  /** ---------- TipTap (controlado por body[lang]) ---------- */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Descreva o evento..." }),
    ],
    content: form.getValues(bodyPath(lang)) || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      form.setValue(bodyPath(lang), html, { shouldDirty: true, shouldValidate: true });
    },
  });

  // troca de idioma → atualiza editor
  useEffect(() => {
    if (!editor) return;
    const current = form.getValues(bodyPath(lang)) || "";
    if (editor.getHTML() !== current) editor.commands.setContent(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, editor]);

  // quando body[lang] mudar via reset/watch → atualiza editor
  useEffect(() => {
    if (!editor) return;
    const sub = form.watch((v, { name }) => {
      if (name === bodyPath(lang)) {
        const val = (v?.body as any)?.[lang] ?? "";
        if (editor.getHTML() !== val) editor.commands.setContent(val || "");
      }
    });
    return () => sub.unsubscribe();
  }, [editor, form, lang]);

  // GET por id
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
          heroImage: data.heroImage ?? "",
          thumbnail: data.thumbnail ?? "",
          category: data.category ?? "",
          company: data.company ?? "",
          location: data.location ?? "",
          startDate: toDatetimeLocalInput(data.startDate),
          endDate: toDatetimeLocalInput(data.endDate),
          pricing: typeof data.pricing === "number" ? data.pricing : 0,
          externalTicketLink: data.externalTicketLink ?? "",
          facilities: Array.isArray(data.facilities)
            ? data.facilities.filter((v: any): v is Facility => FACILITY_OPTIONS.includes(v))
            : [],
          sponsored: !!data.sponsored,
          active: !!data.active,
        };

        form.reset(defaults);
        const current = defaults.body[lang] || "";
        if (editor) editor.commands.setContent(current);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          const msg = e instanceof Error ? e.message : "Falha ao carregar evento.";
          setError(msg);
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isEdit]);

  const titleText = useMemo(() => (isEdit ? "Editar evento" : "Novo evento"), [isEdit]);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const payload: EventDetail = {
        id: idParam ?? "",
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
          pt: values.body.pt, // HTML
          en: values.body.en,
          es: values.body.es,
        },
        heroImage: values.heroImage,
        thumbnail: values.thumbnail,
        category: values.category,
        company: values.company,
        location: values.location,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        pricing: values.pricing,
        externalTicketLink: values.externalTicketLink ?? "",
        facilities: values.facilities,
        sponsored: values.sponsored,
        active: values.active,
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
  const generateSlugFor = (l: LangCode) => {
    const t = form.getValues(titlePath(l)) ?? "";
    form.setValue(slugPath(l), slugify(t), { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{titleText}</CardTitle>
        <CardDescription>Gerencie os dados multilíngua do evento</CardDescription>
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
              {/* Idiomas + campos principais */}
              <div className="grid gap-6 md:grid-cols-5">
                {/* MENU LATERAL */}
                <aside className="md:col-span-1">
                  <div className="rounded-lg border p-2">
                    <div className="px-2 py-1 text-xs font-medium uppercase text-muted-foreground">Idiomas</div>
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

                {/* CAMPOS DO IDIOMA ATIVO */}
                <section key={lang} className="md:col-span-4 grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
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
                              onChange={(e) => field.onChange(e.target.value)}
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
                          <div className="flex items-end gap-2">
                            <div className="flex-1">
                              <FormLabel>Slug ({lang.toUpperCase()})</FormLabel>
                              <FormControl>
                                <Input
                                  name={field.name}
                                  ref={field.ref}
                                  value={field.value ?? ""}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  onBlur={(e) => field.onChange(slugify(e.target.value))}
                                  placeholder="titulo-do-evento"
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              className="shrink-0"
                              onClick={() => generateSlugFor(lang)}
                              title="Gerar slug a partir do título"
                            >
                              Gerar slug
                            </Button>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* WYSIWYG TipTap - controlado por body[lang] */}
                  <FormField
                    control={form.control}
                    name={bodyPath(lang)}
                    render={() => (
                      <FormItem>
                        <FormLabel>Descrição ({lang.toUpperCase()})</FormLabel>
                        <FormControl>
                          <div className="border rounded-md">
                            <div className="flex flex-wrap gap-1 border-b p-2 text-sm">
                              <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                className="px-2 py-1 rounded hover:bg-muted"
                              >
                                <strong>B</strong>
                              </button>
                              <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                className="px-2 py-1 rounded hover:bg-muted italic"
                              >
                                I
                              </button>
                              <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleStrike().run()}
                                className="px-2 py-1 rounded hover:bg-muted line-through"
                              >
                                S
                              </button>
                              <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                                className="px-2 py-1 rounded hover:bg-muted"
                              >
                                • Lista
                              </button>
                              <button
                                type="button"
                                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                                className="px-2 py-1 rounded hover:bg-muted"
                              >
                                1. Lista
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const href = window.prompt("URL do link") || "";
                                  if (href) editor?.chain().focus().setLink({ href }).run();
                                }}
                                className="px-2 py-1 rounded hover:bg-muted"
                              >
                                Link
                              </button>
                            </div>

                            <EditorContent editor={editor} className="prose max-w-none p-3 min-h-[200px]" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
              </div>

              {/* Imagens */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="min-w-0 overflow-hidden">
                  <FormField
                    control={form.control}
                    name="heroImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Imagem Principal</FormLabel>
                        <FormControl>
                          <FileUpload
                            accept="image/*"
                            maxSizeMB={5}
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            loadPreview={async (id) => {
                              const { url, name, size, contentType } = await getPreviewUrl(id);
                              return { url, name, size, contentType };
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="min-w-0 overflow-hidden">
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
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            loadPreview={async (id) => {
                              const { url, name, size, contentType } = await getPreviewUrl(id);
                              return { url, name, size, contentType };
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Categoria / Empresa / Local */}
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <CategoryAutocomplete
                          value={field.value ? String(field.value) : null}
                          parent={false}
                          onChange={(id) => field.onChange(id ?? "")}
                          disabled={saving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa</FormLabel>
                      <FormControl>
                        <CompanyAutocomplete
                          value={field.value ? String(field.value) : null}
                          onChange={(id) => field.onChange(id ?? "")}
                          disabled={saving}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex.: Teatro Municipal, Av. X, 123 – Centro"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Datas */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" value={field.value ?? ""} onChange={field.onChange} />
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
                        <Input type="datetime-local" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Preço / Link externo */}
              <div className="grid gap-4 md:grid-cols-2">
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
                          value={Number.isFinite(field.value as number) ? String(field.value) : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === "" ? 0 : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="externalTicketLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingresso Externo (ex.: Sympla, etc)</FormLabel>
                      <FormControl>
                        <Input placeholder="Link do site de ingressos" value={field.value ?? ""} onChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Facilities */}
              <div className="space-y-2">
                <FormLabel>Facilidades</FormLabel>
                <div className="grid gap-2 md:grid-cols-3">
                  {FACILITY_OPTIONS.map((opt) => (
                    <FormField
                      key={opt}
                      control={form.control}
                      name="facilities"
                      render={({ field }) => {
                        const value: Facility[] = field.value ?? [];
                        const checked = value.includes(opt);
                        return (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  const want = Boolean(v);
                                  const set = new Set(value);
                                  if (want) set.add(opt);
                                  else set.delete(opt);
                                  field.onChange(Array.from(set));
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </div>

              {/* Patrocinado / Ativo */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sponsored"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 pt-6">
                      <FormLabel className="mb-0">Patrocinado</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 pt-6">
                      <FormLabel className="mb-0">Ativo</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={(v) => field.onChange(Boolean(v))} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Ações */}
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
