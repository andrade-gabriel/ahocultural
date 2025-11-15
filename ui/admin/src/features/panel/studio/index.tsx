import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { z } from "zod";
import {
  useForm,
  type SubmitHandler,
  type Resolver,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getStudioById, insertStudio, updateStudio } from "@/api/studio/actions";
import type { I18nValue } from "@/api/i18n/types";
import type { Studio } from "@/api/studio";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  PaintBucket,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Trash2,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription as AlertDialogDescriptionDialog,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";

import { FileUpload } from "@/components/file-upload";
import { cn } from "@/lib/utils";

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

const CategorySchema = z.object({
  name: I18nRequired,
  medias: z.array(z.string()).default([]),
});

const Schema = z.object({
  body: I18nRequired,
  categories: z.array(CategorySchema).default([]),
});

type FormValues = z.infer<typeof Schema>;

type BodyPath = `body.${LangCode}`;
type CategoryNamePath = `categories.${number}.name.${LangCode}`;
type CategoryMediasPath = `categories.${number}.medias`;

const bodyPath = (lang: LangCode): BodyPath => `body.${lang}` as const;

/* ---------- Color UI ---------- */

const SWATCHES = [
  "#000000",
  "#333333",
  "#666666",
  "#999999",
  "#CCCCCC",
  "#FFFFFF",
  "#e91e63",
  "#f50057",
  "#ff1744",
  "#ff9100",
  "#ffea00",
  "#0091ea",
  "#00b0ff",
  "#00e5ff",
  "#00c853",
  "#64dd17",
];

function ColorDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-full border border-border"
      style={{ backgroundColor: color }}
    />
  );
}

function ColorPicker({
  value,
  onChange,
  onClear,
}: {
  value?: string | null;
  onChange: (hex: string) => void;
  onClear: () => void;
}) {
  const [hex, setHex] = useState<string>(value ?? "#000000");

  useEffect(() => {
    setHex(value ?? "#000000");
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 overflow-hidden rounded border">
          <input
            type="color"
            className="h-8 w-8 cursor-pointer border-0 p-0"
            value={hex}
            onChange={(e) => {
              setHex(e.target.value);
              onChange(e.target.value);
            }}
            aria-label="Seletor de cor"
            title="Escolher cor"
          />
        </div>
        <Input
          value={hex}
          onChange={(e) => setHex(e.target.value)}
          onBlur={() => /^#([0-9A-Fa-f]{6})$/.test(hex) && onChange(hex)}
          placeholder="#000000"
          className="h-8 w-28"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          title="Limpar cor"
        >
          Limpar
        </Button>
      </div>
      <Separator orientation="horizontal" className="my-1" />
      <div className="grid grid-cols-8 gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            className="h-5 w-5 rounded-full border"
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
            aria-label={`Aplicar cor ${c}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Toolbar ---------- */

function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  const currentColor = editor.getAttributes("textStyle")?.color || null;

  const Btn = ({
    active,
    onClick,
    title,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    title: string;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      title={title}
      className="rounded"
    >
      {children}
    </Button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border-b p-2 text-sm">
      <Btn
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Negrito"
      >
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Itálico"
      >
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Sublinhado"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Btn>
      <Btn
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Tachado"
      >
        <Strikethrough className="h-4 w-4" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Btn
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Lista com marcadores"
      >
        <List className="h-4 w-4" />
      </Btn>
      <Btn
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Btn
        active={editor.isActive({ textAlign: "left" })}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="Alinhar à esquerda"
      >
        <AlignLeft className="h-4 w-4" />
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: "center" })}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="Centralizar"
      >
        <AlignCenter className="h-4 w-4" />
      </Btn>
      <Btn
        active={editor.isActive({ textAlign: "right" })}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="Alinhar à direita"
      >
        <AlignRight className="h-4 w-4" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 rounded"
            title="Cor do texto"
          >
            <PaintBucket className="h-4 w-4" />
            <ColorDot color={currentColor || "#000000"} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] space-y-2">
          <ColorPicker
            value={currentColor}
            onChange={(hex) => editor.chain().focus().setColor(hex).run()}
            onClear={() => editor.chain().focus().unsetColor().run()}
          />
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Btn
        onClick={() => {
          const href = window.prompt("URL do link") || "";
          if (href) editor.chain().focus().setLink({ href }).run();
        }}
        title="Inserir link"
      >
        <LinkIcon className="h-4 w-4" />
      </Btn>
    </div>
  );
}

/* ---------- page ---------- */

export const StudioLayout = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [lang, setLang] = useState<LangCode>("pt");
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryIndexToDelete, setCategoryIndexToDelete] = useState<number | null>(
    null
  );

  const hasExistingRef = useRef(false);
  const acRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(Schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      body: { pt: "", en: "", es: "" },
      categories: [],
    },
    mode: "onTouched",
  });

  const { control } = form;

  const {
    fields: categoryFields,
    append: appendCategory,
    remove: removeCategory,
  } = useFieldArray({
    control,
    name: "categories",
  });

  const categoriesWatch = useWatch({
    control,
    name: "categories",
  }) as FormValues["categories"] | undefined;

  // garante que selectedCategoryIndex sempre aponte pra algo válido
  useEffect(() => {
    if (categoryFields.length === 0) {
      setSelectedCategoryIndex(0);
      return;
    }
    if (selectedCategoryIndex > categoryFields.length - 1) {
      setSelectedCategoryIndex(categoryFields.length - 1);
    }
  }, [categoryFields.length, selectedCategoryIndex]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: { keepMarks: true, keepAttributes: true },
        bulletList: { keepMarks: true, keepAttributes: true },
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({
        placeholder: "Conte o sobre/manifesto da AHÔ…",
      }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: form.getValues(bodyPath(lang)) || "",
    onUpdate: ({ editor }) => {
      if (mode !== "visual") return;
      const html = editor.getHTML();
      form.setValue(bodyPath(lang), html, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
  });

  // troca de idioma → atualiza editor com o body do idioma selecionado
  useEffect(() => {
    if (!editor) return;
    const current = form.getValues(bodyPath(lang)) || "";
    if (editor.getHTML() !== current) editor.commands.setContent(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, editor]);

  // sync body[lang] vindo de reset/watch
  useEffect(() => {
    if (!editor) return;
    const sub = form.watch((v, { name }) => {
      if (name === bodyPath(lang) && mode === "visual") {
        const val = (v?.body as I18nValue)?.[lang] ?? "";
        if (editor.getHTML() !== val) editor.commands.setContent(val || "");
      }
    });
    return () => sub.unsubscribe();
  }, [editor, form, lang, mode]);

  // ao voltar para Visual, empurra o HTML do form pro editor
  useEffect(() => {
    if (!editor) return;
    if (mode === "visual") {
      const current = form.getValues(bodyPath(lang)) || "";
      if (editor.getHTML() !== current) editor.commands.setContent(current);
    }
  }, [mode, editor, form, lang]);

  // GET studio único
  useEffect(() => {
    setLoading(true);
    setError(undefined);

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    const reqId = ++requestIdRef.current;

    (async () => {
      try {
        const data = await getStudioById({ signal: ac.signal });
        if (reqId !== requestIdRef.current) return;

        hasExistingRef.current = Boolean(data?.body);

        let categories: FormValues["categories"] = [];
        const rawCats: any = (data as any)?.categories;

        if (Array.isArray(rawCats)) {
          categories = rawCats.map((c: any) => ({
            name: {
              pt: c?.name?.pt ?? "",
              en: c?.name?.en ?? "",
              es: c?.name?.es ?? "",
            },
            medias: Array.isArray(c?.medias)
              ? c.medias.filter((m: any) => typeof m === "string")
              : [],
          }));
        } else if (rawCats && typeof rawCats === "object") {
          categories = Object.values(rawCats).map((c: any) => ({
            name: {
              pt: c?.name?.pt ?? "",
              en: c?.name?.en ?? "",
              es: c?.name?.es ?? "",
            },
            medias: Array.isArray(c?.medias)
              ? c.medias.filter((m: any) => typeof m === "string")
              : [],
          }));
        }

        const defaults: FormValues = {
          body: {
            pt: data?.body?.pt ?? "",
            en: data?.body?.en ?? "",
            es: data?.body?.es ?? "",
          },
          categories,
        };

        form.reset(defaults);
        const current = defaults.body[lang] || "";
        if (editor) editor.commands.setContent(current);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          hasExistingRef.current = false;
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleText = useMemo(() => "Studio", []);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const categoriesRecord: Studio["categories"] = [] as any;
      values.categories.forEach((cat, index) => {
        (categoriesRecord as any)[index] = {
          name: {
            pt: cat.name.pt ?? "",
            en: cat.name.en ?? "",
            es: cat.name.es ?? "",
          },
          medias: (cat.medias ?? []).filter(Boolean),
        };
      });

      const payload: Studio = {
        body: {
          pt: values.body.pt,
          en: values.body.en,
          es: values.body.es,
        },
        categories: categoriesRecord,
      };

      if (hasExistingRef.current) await updateStudio(payload);
      else await insertStudio(payload);

      navigate("/studio", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar Studio.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = () => {
    const newIndex = categoryFields.length;
    appendCategory({
      name: { pt: "", en: "", es: "" },
      medias: [],
    });
    setSelectedCategoryIndex(newIndex);
  };

  const handleRemoveCategory = (index: number) => {
    removeCategory(index);
  };

  const requestDeleteCategory = (index: number) => {
    setCategoryIndexToDelete(index);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteCategory = () => {
    if (categoryIndexToDelete == null) {
      setDeleteDialogOpen(false);
      return;
    }
    handleRemoveCategory(categoryIndexToDelete);
    setDeleteDialogOpen(false);
    setCategoryIndexToDelete(null);
  };

  const cancelDeleteCategory = () => {
    setDeleteDialogOpen(false);
    setCategoryIndexToDelete(null);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{titleText}</CardTitle>
        <CardDescription>Gerencie o conteúdo multilíngua do “Studio”</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-6"
                aria-busy={saving}
              >
                <div className="grid gap-6 md:grid-cols-5">
                  {/* Lateral de idiomas */}
                  <aside className="md:col-span-1">
                    <div className="rounded-lg border p-3">
                      <div className="px-1 py-1 text-xs font-medium uppercase text-muted-foreground">
                        IDIOMAS
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

                  {/* Conteúdo principal – editor */}
                  <section className="md:col-span-4 space-y-6">
                    <div className="grid gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={mode === "visual" ? "default" : "outline"}
                          onClick={() => setMode("visual")}
                          className="h-8"
                        >
                          Visual
                        </Button>
                        <Button
                          type="button"
                          variant={mode === "html" ? "default" : "outline"}
                          onClick={() => setMode("html")}
                          className="h-8"
                        >
                          HTML
                        </Button>
                      </div>
                      <FormField
                        key={`${lang}-${mode}`}
                        control={form.control}
                        name={bodyPath(lang)}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo ({lang.toUpperCase()})</FormLabel>
                            <FormControl>
                              <div className="rounded-md border">
                                {mode === "visual" && <EditorToolbar editor={editor} />}

                                {mode === "visual" ? (
                                  <EditorContent
                                    editor={editor}
                                    className="prose max-w-none min-h-[240px] p-3"
                                  />
                                ) : (
                                  <textarea
                                    className="w-full min-h-[240px] border-0 p-3 font-mono text-sm outline-none"
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                  />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </section>
                </div>

                {/* Seção de categorias */}
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold">Categorias do Studio</h2>
                  <p className="text-xs text-muted-foreground">
                    Use o seletor de idioma à esquerda para editar o nome da categoria
                    em cada língua. Use a lista abaixo para navegar entre as categorias.
                  </p>
                </div>

                {categoryFields.length === 0 ? (
                  <div className="grid gap-6 md:grid-cols-5">
                    <p className="text-sm text-muted-foreground">
                      Nenhuma categoria cadastrada.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-dashed"
                      onClick={handleAddCategory}
                    >
                      Adicionar primeira categoria
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-5">
                    {/* Lista de categorias (esquerda) */}
                    <aside className="md:col-span-1">
                      <div className="rounded-lg border p-3">
                        <div className="px-1 py-1 text-xs font-medium uppercase text-muted-foreground">
                          CATEGORIAS
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          {categoryFields.map((field, index) => {
                            const active = index === selectedCategoryIndex;
                            const cat = categoriesWatch?.[index];
                            const label =
                              cat?.name?.[lang] || cat?.name?.pt || `Categoria ${index + 1}`;

                            return (
                              <div
                                key={field.id}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                                  active
                                    ? "bg-black text-white border-black"
                                    : "bg-background text-foreground"
                                )}
                              >
                                <button
                                  type="button"
                                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                  onClick={() => setSelectedCategoryIndex(index)}
                                  aria-pressed={active}
                                >
                                  {/* bolinha do número */}
                                  <span
                                    className={cn(
                                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                                      active
                                        ? "bg-white/10 text-white border border-white/40"
                                        : "bg-muted text-foreground"
                                    )}
                                  >
                                    {index + 1}
                                  </span>

                                  {/* texto com ellipsis */}
                                  <span className="min-w-0 flex-1 truncate">
                                    {label}
                                  </span>
                                </button>

                                {/* ícone de lixeira */}
                                <button
                                  type="button"
                                  className={cn(
                                    "shrink-0 transition-colors",
                                    active
                                      ? "text-white hover:text-white/80"
                                      : "text-destructive hover:text-destructive/80"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    requestDeleteCategory(index);
                                  }}
                                  title="Remover categoria"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            );
                          })}


                          {categoryFields.length > 0 && (
                            <Button
                              type="button"
                              variant="outline"
                              className="mt-1 w-full border-dashed"
                              onClick={handleAddCategory}
                            >
                              Adicionar categoria
                            </Button>
                          )}
                        </div>
                      </div>
                    </aside>

                    {/* Detalhes da categoria selecionada (direita) */}
                    <section className="md:col-span-4 space-y-6">
                      {categoryFields[selectedCategoryIndex] && (
                        <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
                          <FormField
                            key={`${selectedCategoryIndex}-${lang}`}
                            control={form.control}
                            name={
                              `categories.${selectedCategoryIndex}.name.${lang}` as CategoryNamePath
                            }
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Nome da categoria ({lang.toUpperCase()})
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    name={field.name}
                                    ref={field.ref}
                                    value={field.value ?? ""}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    onBlur={field.onBlur}
                                    placeholder="Ex.: Cenografia e Ambientação"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            key={`cat-medias-${selectedCategoryIndex}`} // só depende da categoria
                            control={form.control}
                            name={
                              `categories.${selectedCategoryIndex}.medias` as CategoryMediasPath
                            }
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel>Imagens da categoria</FormLabel>
                                <FormControl>
                                  <FileUpload
                                    key={`fileupload-${selectedCategoryIndex}`} // opcional, ajuda a remountar ao trocar de categoria
                                    accept="image/*"
                                    maxSizeMB={5}
                                    name={field.name}
                                    value={field.value ?? []}
                                    onChange={(ids) => field.onChange(ids ?? [])}
                                    baseUrl="https://qa.ahocultural.com/assets"
                                    onBlur={field.onBlur}
                                    ref={field.ref}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                        </div>
                      )}
                    </section>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-end gap-2">
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

            {/* Modal de confirmação de exclusão de categoria */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover categoria</AlertDialogTitle>
                  <AlertDialogDescriptionDialog>
                    Tem certeza que deseja remover esta categoria? Essa ação não pode ser
                    desfeita, mas você poderá criar outra depois.
                  </AlertDialogDescriptionDialog>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={cancelDeleteCategory}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteCategory}
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
      <CardFooter />
    </Card>
  );
};
