import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getArticleById,
  insertArticle,
  updateArticle,
  type ArticleDetail,
} from "@/api/article";

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

/** ---------- TipTap ---------- */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { FileUpload } from "@/components/file-upload";
import { getPreviewUrl } from "@/api/file";

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

/* ---------- schema ---------- */
const Schema = z.object({
  title: z.string().min(1, "Título obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  heroImage: z.string().min(1, "Imagem principal obrigatória").nullable().refine(
    (v) => v !== null && v.trim().length > 0,
    "Imagem principal obrigatória"
  ),
  thumbnail: z.string().min(1, "Thumbnail obrigatória").nullable().refine(
    (v) => v !== null && v.trim().length > 0,
    "Thumbnail obrigatória"
  ),
  body: z.string().min(1, "Corpo da matéria obrigatório"),
  publicationDate: z.string().min(1, "Data obrigatória"), // YYYY-MM-DD vindo do <input type="date" />
  active: z.boolean(),
});

type FormValues = z.infer<typeof Schema>;

/* ---------- helpers ---------- */
function toDateInputValue(d: Date | string | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* ---------- page ---------- */

export function ArticleDetailLayout() {
  const { id: idParam } = useParams(); // /article/:id (em /article/new ficará undefined)
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
      heroImage: "",
      thumbnail: "",
      body: "",
      publicationDate: "",
      active: true,
    },
    mode: "onTouched",
  });

  /** ---------- TipTap editor ---------- */
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({
        placeholder: "Escreva o conteúdo da matéria aqui...",
      }),
    ],
    content: form.getValues("body") || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      form.setValue("body", html, { shouldDirty: true, shouldValidate: true });
    },
  });

  // Sincroniza o editor quando a tela entra em modo edição e carrega defaults
  useEffect(() => {
    const subscription = form.watch((v, { name }) => {
      if (name === "body" && editor && v?.body != null) {
        // se o valor foi alterado por reset, reflete no editor
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
        const data = await getArticleById(idParam, { signal: ac.signal });

        if (reqId !== requestIdRef.current) return; // resposta antiga, ignora

        const defaults: FormValues = {
          title: data.title ?? "",
          slug: data.slug ?? "",
          heroImage: data.heroImage ?? "",
          thumbnail: data.thumbnail ?? "",
          body: data.body ?? "",
          publicationDate: toDateInputValue(data.publicationDate),
          active: !!data.active,
        };

        form.reset(defaults);
        // também atualiza o editor
        if (editor) editor.commands.setContent(defaults.body || "");
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          const msg = e instanceof Error ? e.message : "Falha ao carregar matéria.";
          setError(msg);
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isEdit]);

  const title = useMemo(() => (isEdit ? "Editar matéria" : "Nova matéria"), [isEdit]);

  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const payload: ArticleDetail = {
        id: idParam ?? "", // backend pode ignorar em POST
        title: values.title,
        slug: values.slug,
        heroImage: values.heroImage,
        thumbnail: values.thumbnail,
        body: values.body, // HTML do TipTap
        publicationDate: new Date(values.publicationDate),
        active: values.active,
      };

      if (isEdit && idParam) await updateArticle(idParam, payload);
      else await insertArticle(payload);

      navigate("/article", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar matéria.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Gerencie os dados da matéria</CardDescription>
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
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Título da matéria" {...field} />
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
                        <Input placeholder="titulo-da-materia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
                              // usa sua action que devolve URL assinada de GET
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
                              // usa sua action que devolve URL assinada de GET
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
              <div className="grid gap-4 md:grid-cols-2">

              </div>

              {/* WYSIWYG TipTap */}
              <FormField
                control={form.control}
                name="body"
                render={() => (
                  <FormItem>
                    <FormLabel>Conteúdo</FormLabel>
                    <FormControl>
                      <div className="border rounded-md">
                        {/* Toolbar minimalista */}
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

                        <EditorContent editor={editor} className="prose max-w-none p-3 min-h-[180px]" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="publicationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de publicação</FormLabel>
                      <FormControl>
                        <Input type="date" value={field.value ?? ""} onChange={field.onChange} />
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