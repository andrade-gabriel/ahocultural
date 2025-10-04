import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getEventById,
  insertEvent,
  updateEvent,
  type EventDetail,
} from "@/api/event";

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
import { Loader2, Plus, Trash2 } from "lucide-react";

/** ---------- TipTap ---------- */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

/* ---------- helpers ---------- */
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

/* ---------- schema ---------- */
const Schema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  category: z.string().min(1, "Categoria obrigatória"),
  imageUrl: z.string().url("URL inválida").or(z.literal("")).transform((v) => (v === "" ? "" : v)),
  body: z.string().min(1, "Conteúdo obrigatório"),
  startDate: z.string().min(1, "Início obrigatório"),        // yyyy-mm-ddThh:mm
  endDate: z.string().min(1, "Fim obrigatório"),
  location: z.string().min(1, "Local obrigatório"),
  pricing: z.coerce.number().min(0, "Preço inválido"),
  facilities: z.array(z.object({ value: z.string().min(1, "Informe o item") })).default([]),
  sponsored: z.boolean().default(false),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof Schema>;

/* ---------- page ---------- */

export function EventDetailLayout() {
  const { id: idParam } = useParams(); // /event/:id (ou undefined em /event/new)
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
      title: "",
      slug: "",
      category: "",
      imageUrl: "",
      body: "",
      startDate: "",
      endDate: "",
      location: "",
      pricing: 0,
      facilities: [],
      sponsored: false,
      active: true,
    },
    mode: "onTouched",
  });

  /** ---------- FieldArray para facilities ---------- */
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "facilities",
  });

  /** ---------- TipTap editor ---------- */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({
        placeholder: "Descreva o evento...",
      }),
    ],
    content: form.getValues("body") || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      form.setValue("body", html, { shouldDirty: true, shouldValidate: true });
    },
  });

  // Sincroniza o editor quando carregar defaults
  useEffect(() => {
    const subscription = form.watch((v, { name }) => {
      if (name === "body" && editor && v?.body != null) {
        if (editor.getHTML() !== v.body) {
          editor.commands.setContent(v.body || "");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [editor, form]);

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
        const data = await getEventById(idParam, { signal: ac.signal });

        if (reqId !== requestIdRef.current) return; // resposta antiga, ignora

        const defaults: FormValues = {
          title: data.title ?? "",
          slug: data.slug ?? "",
          category: data.category ?? "",
          imageUrl: data.imageUrl ?? "",
          body: data.body ?? "",
          startDate: toDatetimeLocalInput(data.startDate),
          endDate: toDatetimeLocalInput(data.endDate),
          location: data.location ?? "",
          pricing: typeof data.pricing === "number" ? data.pricing : 0,
          facilities: Array.isArray(data.facilities)
            ? data.facilities.map((v) => ({ value: v }))
            : [],
          sponsored: !!data.sponsored,
          active: !!data.active,
        };

        form.reset(defaults);
        if (editor) editor.commands.setContent(defaults.body || "");
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

  const title = useMemo(() => (isEdit ? "Editar evento" : "Novo evento"), [isEdit]);

  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const payload: EventDetail = {
        id: idParam ?? "",
        title: values.title,
        slug: values.slug,
        category: values.category,
        imageUrl: values.imageUrl || "",
        body: values.body, // HTML do TipTap
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        location: values.location,
        pricing: values.pricing,
        facilities: values.facilities.map((f) => f.value).filter(Boolean),
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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Gerencie os dados do evento</CardDescription>
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
              {/* Título / Slug */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título do evento" {...field} />
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
                        <Input placeholder="titulo-do-evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Categoria / Imagem */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input placeholder="Categoria do evento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagem (URL)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
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

              {/* Local / Preço */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço / cidade / local do evento" {...field} />
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
                          value={Number.isFinite(field.value as number) ? String(field.value) : ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* WYSIWYG TipTap */}
              <FormField
                control={form.control}
                name="body"
                render={() => (
                  <FormItem>
                    <FormLabel>Descrição do evento</FormLabel>
                    <FormControl>
                      <div className="border rounded-md">
                        {/* Toolbar minimalista */}
                        <div className="flex flex-wrap gap-1 border-b p-2 text-sm">
                          <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className="px-2 py-1 rounded hover:bg-muted">
                            <strong>B</strong>
                          </button>
                          <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className="px-2 py-1 rounded hover:bg-muted italic">
                            I
                          </button>
                          <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className="px-2 py-1 rounded hover:bg-muted line-through">
                            S
                          </button>
                          <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="px-2 py-1 rounded hover:bg-muted">
                            • Lista
                          </button>
                          <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="px-2 py-1 rounded hover:bg-muted">
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

              {/* Facilities */}
              <div className="space-y-2">
                <FormLabel>Facilidades (ex.: estacionamento, acessibilidade)</FormLabel>
                <div className="grid gap-2">
                  {fields.length === 0 ? (
                    <div className="text-xs text-muted-foreground">Nenhum item adicionado.</div>
                  ) : null}

                  {fields.map((f, idx) => (
                    <div key={f.id} className="flex gap-2 items-start">
                      <FormField
                        control={form.control}
                        name={`facilities.${idx}.value`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input placeholder="Digite a facilidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => remove(idx)}
                        aria-label="Remover facilidade"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => append({ value: "" })}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar facilidade
                </Button>
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
