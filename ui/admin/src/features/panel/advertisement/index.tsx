import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAdvertisementById, insertAdvertisement, updateAdvertisement } from "@/api/advertisement/actions";
import type { I18nValue } from "@/api/i18n/types";

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
import { Loader2, Bold, Italic, Strikethrough, List, ListOrdered, Link as LinkIcon, PaintBucket, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

/** ---------- TipTap ---------- */
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { TextAlign } from "@tiptap/extension-text-align";
import { Underline } from "@tiptap/extension-underline";

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

const Schema = z.object({
  body: I18nRequired, // HTML por idioma
});

type FormValues = z.infer<typeof Schema>;
type BodyPath = `body.${LangCode}`;
const bodyPath = (lang: LangCode): BodyPath => `body.${lang}` as const;

/* ---------- Color UI ---------- */
const SWATCHES = [
  "#000000", "#333333", "#666666", "#999999", "#CCCCCC", "#FFFFFF",
  "#e91e63", "#f50057", "#ff1744", "#ff9100", "#ffea00",
  "#0091ea", "#00b0ff", "#00e5ff", "#00c853", "#64dd17",
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
    // mantem preview em sincronia quando selection muda
    setHex(value ?? "#000000");
  }, [value]);

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="gap-2 rounded" title="Cor do texto">
        <PaintBucket className="h-4 w-4" />
        <ColorDot color={value || "#000000"} />
      </Button>
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
        <Button type="button" variant="ghost" size="sm" onClick={onClear} title="Limpar cor">
          Limpar
        </Button>
      </div>
      <Separator orientation="vertical" className="mx-2 h-6" />
      <div className="grid grid-cols-8 gap-2">
        {SWATCHES.map((c) => (
          <button
            key={c}
            className="h-5 w-5 rounded-full border"
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
            title={c}
            aria-label={`Aplicar cor ${c}`}
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
      <Btn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico">
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado">
        <UnderlineIcon className="h-4 w-4" />
      </Btn>
      <Btn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Tachado">
        <Strikethrough className="h-4 w-4" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Btn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Lista com marcadores">
        <List className="h-4 w-4" />
      </Btn>
      <Btn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Lista numerada">
        <ListOrdered className="h-4 w-4" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Btn active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Alinhar à esquerda">
        <AlignLeft className="h-4 w-4" />
      </Btn>
      <Btn active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Centralizar">
        <AlignCenter className="h-4 w-4" />
      </Btn>
      <Btn active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Alinhar à direita">
        <AlignRight className="h-4 w-4" />
      </Btn>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <ColorPicker
        value={currentColor}
        onChange={(hex) => editor.chain().focus().setColor(hex).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />

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
export const AdvertisementLayout = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [lang, setLang] = useState<LangCode>("pt");
  const [mode, setMode] = useState<"visual" | "html">("visual"); // toggle Visual/HTML

  // Indica se já existe registro (para decidir entre insert/update)
  const hasExistingRef = useRef(false);

  const acRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // ------------ RHF ------------
  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(Schema) as unknown as Resolver<FormValues>,
    defaultValues: { body: { pt: "", en: "", es: "" } },
    mode: "onTouched",
  });

  /** ---------- TipTap (controlado por body[lang]) ---------- */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        orderedList: { keepMarks: true, keepAttributes: true },
        bulletList: { keepMarks: true, keepAttributes: true },
      }),
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder: "Conte o sobre/manifesto da AHÔ…" }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
    ],
    content: form.getValues(bodyPath(lang)) || "",
    onUpdate: ({ editor }) => {
      if (mode !== "visual") return;
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

  // quando body[lang] mudar via reset/watch → atualiza editor (somente no modo visual)
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

  // alternar Visual/HTML → empurra o conteúdo do form pro editor quando voltar ao Visual
  useEffect(() => {
    if (!editor) return;
    if (mode === "visual") {
      const current = form.getValues(bodyPath(lang)) || "";
      if (editor.getHTML() !== current) editor.commands.setContent(current);
    }
  }, [mode, editor, form, lang]);

  // GET (registro único)
  useEffect(() => {
    setLoading(true);
    setError(undefined);

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    const reqId = ++requestIdRef.current;

    (async () => {
      try {
        const data = await getAdvertisementById({ signal: ac.signal });
        if (reqId !== requestIdRef.current) return;

        hasExistingRef.current = Boolean(data?.body);
        const defaults: FormValues = {
          body: {
            pt: data?.body?.pt ?? "",
            en: data?.body?.en ?? "",
            es: data?.body?.es ?? "",
          },
        };

        form.reset(defaults);
        const current = defaults.body[lang] || "";
        if (editor) editor.commands.setContent(current);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          // Mantém a tela utilizável mesmo com erro, para permitir salvar do zero
          hasExistingRef.current = false;
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const titleText = useMemo(() => "Seu Espaço na AHÔ", []);

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const payload = {
        body: {
          pt: values.body.pt,
          en: values.body.en,
          es: values.body.es,
        },
      };

      if (hasExistingRef.current) await updateAdvertisement(payload);
      else await insertAdvertisement(payload);

      navigate("/advertisement", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar Seu Espaço na AHÔ.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{titleText}</CardTitle>
        <CardDescription>Gerencie o conteúdo multilíngua do “Seu Espaço na AHÔ”</CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6" aria-busy={saving}>
              {/* Idiomas + editor */}
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

                {/* EDITOR DO IDIOMA ATIVO */}
                <section key={lang} className="md:col-span-4 grid gap-3">
                  {/* Toggle Visual / HTML */}
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
                    control={form.control}
                    name={bodyPath(lang)}
                    render={() => (
                      <FormItem>
                        <FormLabel>Conteúdo ({lang.toUpperCase()})</FormLabel>
                        <FormControl>
                          <div className="border rounded-md">
                            {/* Toolbar (somente no modo Visual) */}
                            {mode === "visual" && <EditorToolbar editor={editor} />}

                            {mode === "visual" ? (
                              <EditorContent editor={editor} className="prose max-w-none p-3 min-h-[240px]" />
                            ) : (
                              <textarea
                                className="w-full min-h-[240px] font-mono text-sm border-0 p-3 outline-none"
                                value={form.watch(bodyPath(lang)) ?? ""}
                                onChange={(e) =>
                                  form.setValue(bodyPath(lang), e.target.value, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                }
                              />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>
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
};