import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { z } from "zod";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  getCategoryById,
  insertCategory,
  updateCategory,
  type CategoryDetail,
} from "@/api/category";

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
  parent_id: z.string().optional().nullable(),
  name: z.string().min(1, "Nome obrigatório"),
  slug: z.string().min(1, "Slug obrigatório"),
  description: z.string().optional().nullable(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof Schema>;

/* ---------- page ---------- */

export function CategoryDetailLayout() {
  const { id: idParam } = useParams(); // /category/:id (em /category/new ficará undefined)
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
      parent_id: null,
      name: "",
      slug: "",
      description: "",
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
        const data = await getCategoryById(idParam, { signal: ac.signal });

        if (reqId !== requestIdRef.current) return; // resposta antiga, ignora

        const defaults: FormValues = {
          parent_id: data.parent_id ?? null,
          name: data.name ?? "",
          slug: data.slug ?? "",
          description: data.description ?? "",
          active: !!data.active,
        };

        form.reset(defaults);
      } catch (e) {
        if (reqId !== requestIdRef.current) return;
        if (!isAbortError(e)) {
          const msg = e instanceof Error ? e.message : "Falha ao carregar categoria.";
          setError(msg);
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    })();

    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idParam, isEdit]);

  const title = useMemo(() => (isEdit ? "Editar categoria" : "Nova categoria"), [isEdit]);

  const onSubmit: SubmitHandler<FormOutput> = async (values) => {
    try {
      setSaving(true);
      setError(undefined);

      const payload: CategoryDetail = {
        id: idParam ?? "", // backend pode ignorar em POST
        parent_id: values.parent_id && values.parent_id.trim() !== "" ? values.parent_id : null,
        name: values.name,
        slug: values.slug,
        description:
          values.description == null || values.description.trim() === ""
            ? null
            : values.description,
        active: values.active,
      };

      if (isEdit && idParam) await updateCategory(idParam, payload);
      else await insertCategory(payload);

      navigate("/category", { replace: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao salvar categoria.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Gerencie os dados da categoria</CardDescription>
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da categoria" {...field} />
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
                        <Input placeholder="nome-da-categoria" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria pai (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ID da categoria pai" value={field.value ?? ""} onChange={field.onChange} />
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

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Breve descrição da categoria" value={field.value ?? ""} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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