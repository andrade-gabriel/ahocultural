import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { getAdById, insertAd, updateAd } from "@/api/ad";
import SyncSelect from "@/components/autocomplete/SyncSelect";
import { listCategories } from "@/api/category";
import type { Category } from "@/api/category/types";
import type { Ad, AdType, AdMenuType, AdCategory, AdMenu } from "@/api/ad/types";

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
import { FileUpload } from "@/components/file-upload";

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

const Schema = z
    .object({
        // AdType = 1 | 2
        type: z
            .number()
            .int()
            .min(1, "Tipo obrigatório")
            .max(2, "Tipo inválido"),
        title: I18nRequired,
        url: z.string().min(1, 'Url Externa obrigatória'),
        startDate: z.string().min(1, "Data inicial obrigatória"), // YYYY-MM-DD
        endDate: z.string().min(1, "Data final obrigatória"), // YYYY-MM-DD
        thumbnail: z.array(z.string()).min(1, "Thumbnail obrigatória"),
        pricing: z.number().min(0, "Preço obrigatório"),
        active: z.boolean(),
        categoryId: z.string().optional(),
        // guardo como number no form para ficar alinhado com AdMenuType
        menuType: z
            .number()
            .int()
            .min(1, "Tipo de menu inválido")
            .max(4, "Tipo de menu inválido")
            .optional(),
    })
    .superRefine((val, ctx) => {
        const start = new Date(val.startDate);
        const end = new Date(val.endDate);

        if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            if (start > end) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "`Data inicial` não pode ser maior que `Data final`.",
                    path: ["startDate"],
                });
            }
        }

        // Se type = 2 (Category) precisa de categoryId
        if (val.type === 2) {
            if (!val.categoryId || val.categoryId.trim() === "") {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Informe a categoria para este anúncio.",
                    path: ["categoryId"],
                });
            }
        }

        // Se type = 1 (Menu) precisa de menuType
        if (val.type === 1) {
            if (val.menuType == null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Selecione um tipo de menu.",
                    path: ["menuType"],
                });
            }
        }
    });

type FormValues = z.infer<typeof Schema>;

/* ---------- typed field paths ---------- */

type TitlePath = `title.${LangCode}`;
const titlePath = (lang: LangCode): TitlePath => `title.${lang}` as const;

/* ---------- utils ---------- */

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

export function AdDetailLayout() {
    const params = useParams();
    const rawId = params.id;
    const idParam = rawId ? Number(rawId) : undefined;
    const isEdit = typeof idParam === "number" && Number.isFinite(idParam);

    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(isEdit);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string>();
    const [lang, setLang] = useState<LangCode>("pt");

    const acRef = useRef<AbortController | null>(null);
    const requestIdRef = useRef(0); // garante "última request vence"

    const form = useForm<FormValues>({
        resolver: zodResolver(Schema),
        defaultValues: {
            type: 1, // default Menu
            title: { pt: "", en: "", es: "" },
            url: '',
            startDate: "",
            endDate: "",
            thumbnail: [],
            pricing: 0,
            active: true,
            categoryId: "",
            menuType: undefined,
        },
        mode: "onTouched",
    });

    const watchType = form.watch("type");

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
                const data = await getAdById(idParam, { signal: ac.signal });

                if (reqId !== requestIdRef.current) return; // resposta antiga, ignora

                const menuType = data.type === 1 ? (data as AdMenu).menuType as AdMenuType : undefined;
                const categoryId = data.type === 2 ? (data as AdCategory).categoryId : undefined;
                const defaults: FormValues = {
                    type: data.type as AdType, // 1 | 2
                    title: {
                        pt: data.title?.pt ?? "",
                        en: data.title?.en ?? "",
                        es: data.title?.es ?? "",
                    },
                    url: data.url,
                    startDate: toDateInputValue(data.startDate),
                    endDate: toDateInputValue(data.endDate),
                    thumbnail: data.thumbnail ? [data.thumbnail] : [],
                    pricing: data.pricing ?? 0,
                    active: !!data.active,
                    categoryId:
                        data.type === 2 && categoryId !== undefined && categoryId !== null
                            ? String(categoryId)
                            : "",
                    menuType: data.type === 1 ? menuType : undefined
                };

                form.reset(defaults);
            } catch (e) {
                if (reqId !== requestIdRef.current) return;
                if (!isAbortError(e)) {
                    const msg = e instanceof Error ? e.message : "Falha ao carregar anúncio.";
                    setError(msg);
                }
            } finally {
                if (reqId === requestIdRef.current) setLoading(false);
            }
        })();

        return () => ac.abort();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idParam, isEdit]);

    const titleText = useMemo(
        () => (isEdit ? "Editar anúncio" : "Novo anúncio"),
        [isEdit]
    );

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        try {
            setSaving(true);
            setError(undefined);

            const base: Ad = {
                id: isEdit && idParam ? idParam : 0,
                type: values.type as AdType,
                url: values.url,
                title: {
                    pt: values.title.pt.trim(),
                    en: values.title.en.trim(),
                    es: values.title.es.trim(),
                },
                startDate: new Date(values.startDate),
                endDate: new Date(values.endDate),
                thumbnail: values.thumbnail[0],
                pricing: values.pricing,
                active: values.active,
            };

            // 2) Especialização por tipo
            let payload: Ad | AdCategory | AdMenu = base;

            if (values.type === 1) {
                // Menu
                if (values.menuType == null) {
                    throw new Error("Tipo de menu obrigatório para anúncios de menu.");
                }

                payload = {
                    ...base,
                    type: 1 as AdType,
                    menuType: values.menuType as AdMenuType,
                } as AdMenu;
            } else if (values.type === 2) {
                // Category
                if (!values.categoryId) {
                    throw new Error("Categoria obrigatória para anúncios de categoria.");
                }

                payload = {
                    ...base,
                    type: 2 as AdType,
                    categoryId: Number(values.categoryId),
                } as AdCategory;
            }

            if (isEdit && idParam) await updateAd(idParam, payload);
            else await insertAd(payload);

            navigate("/ads", { replace: true });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Falha ao salvar anúncio.";
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{titleText}</CardTitle>
                <CardDescription>Gerencie os dados do anúncio</CardDescription>
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
                            {/* Idiomas + campos principais */}
                            <div className="grid gap-6 md:grid-cols-5">
                                {/* MENU LATERAL */}
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
                                                        <span className="font-medium">{l.label}</span>
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </aside>

                                {/* CAMPOS DO IDIOMA ATIVO + tipo */}
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
                                                            placeholder="Título do anúncio"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="url"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Url Externa</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            name={field.name}
                                                            ref={field.ref}
                                                            value={field.value ?? ""}
                                                            onChange={(e) => field.onChange(e.target.value)}
                                                            onBlur={field.onBlur}
                                                            placeholder="https://seuwebsite.com.br/"
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Campos condicionais por tipo */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Tipo do anúncio</FormLabel>
                                                    <FormControl>
                                                        <select
                                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                            value={field.value}
                                                            onChange={(e) =>
                                                                field.onChange(Number(e.target.value))
                                                            }
                                                        >
                                                            <option value={1}>Menu</option>
                                                            <option value={2}>Categoria</option>
                                                        </select>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {watchType === 2 && (
                                            <FormField
                                                control={form.control}
                                                name="categoryId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Categoria</FormLabel>
                                                        <FormControl>
                                                            <SyncSelect<Category>
                                                                // carrega até 1000 categorias
                                                                load={(signal) =>
                                                                    listCategories(
                                                                        { skip: 0, take: 1000 },
                                                                        { signal }
                                                                    )
                                                                }
                                                                getOptionLabel={(item) => item.name_pt}
                                                                // valor que será salvo no form (string)
                                                                getOptionValue={(item) => String((item as any).id)}
                                                                // RHF trabalha com string, SyncSelect espera string | null
                                                                value={field.value ?? null}
                                                                onChange={(value) => {
                                                                    // no form salvamos sempre string (ou "")
                                                                    field.onChange(value ?? "");
                                                                }}
                                                                placeholder="Selecione uma categoria"
                                                                disabled={saving}
                                                                allowClear
                                                                className="w-full"
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}


                                        {watchType === 1 && (
                                            <FormField
                                                control={form.control}
                                                name="menuType"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Tipo de menu</FormLabel>
                                                        <FormControl>
                                                            <select
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                                value={field.value ?? ""}
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target.value === ""
                                                                            ? undefined
                                                                            : Number(e.target.value)
                                                                    )
                                                                }
                                                            >
                                                                <option value="">Selecione…</option>
                                                                <option value={1}>Pra hoje</option>
                                                                <option value={2}>Este fim de semana</option>
                                                                <option value={3}>Esta semana</option>
                                                                <option value={4}>Destaques</option>
                                                            </select>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Datas & Ativo */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Data inicial</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
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
                                            <FormLabel>Data final</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
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
                                            <FormLabel>Preço (apenas para relatório)</FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-1">
                                                    <span className="px-2 py-2 border border-input rounded-l-md bg-muted text-sm">
                                                        R$
                                                    </span>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        className="rounded-l-none"
                                                        value={field.value ?? 0}
                                                        onChange={(e) => {
                                                            const n = Number(e.target.value);
                                                            field.onChange(Number.isNaN(n) ? 0 : n);
                                                        }}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />


                            </div>

                            {/* Imagem (thumbnail) & preço */}
                            <div className="grid gap-4 md:grid-cols-2">
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
                                                        value={field.value ?? []}
                                                        onChange={(ids) => field.onChange(ids ?? [])}
                                                        maxFiles={1}
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
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-3 pt-6">
                                            <FormLabel className="mb-0">Ativo</FormLabel>
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

                            <div className="mt-4 text-xs">
                                <h4 className="font-mono mb-1">Form debug</h4>
                                <pre className="bg-slate-900 text-green-400 p-2 rounded max-h-64 overflow-auto">
                                    {JSON.stringify(
                                        {
                                            values: form.getValues(),
                                            errors: form.formState.errors,
                                            touched: form.formState.touchedFields,
                                            dirty: form.formState.dirtyFields,
                                            isSubmitting: form.formState.isSubmitting,
                                            isValid: form.formState.isValid,
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
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
